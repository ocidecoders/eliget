require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Notification = require('./models/Notification');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', credentials: true } });

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  const token = req.cookies.eliget_token;
  if (!token) return res.redirect('/login.html');
  jwt.verify(token, process.env.JWT_SECRET || 'eliget_super_secret_key_change_in_production', (err) => {
    if (err) { res.clearCookie('eliget_token'); return res.redirect('/login.html'); }
    return res.redirect('/home.html');
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected to Eliget'))
  .catch(err => console.log('MongoDB Error:', err));

const upload = multer({ storage: multer.memoryStorage() });
const JWT_SECRET = process.env.JWT_SECRET || 'eliget_super_secret_key_change_in_production';

io.use((socket, next) => {
  const cookies = socket.request.headers.cookie;
  if (!cookies) return next(new Error('Authentication error'));
  const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('eliget_token='));
  if (!tokenCookie) return next(new Error('Authentication error'));
  const token = tokenCookie.split('=')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.userId = decoded.id;
    next();
  });
});

io.on('connection', (socket) => {
  socket.join(socket.userId);
  socket.on('sendMessage', async (data) => {
    try {
      const { receiverId, text } = data;
      const newMessage = new Message({ sender: socket.userId, receiver: receiverId, text });
      await newMessage.save();
      io.to(receiverId).emit('receiveMessage', newMessage);
      io.to(socket.userId).emit('receiveMessage', newMessage);
    } catch (err) { console.error(err); }
  });
});

const authenticateToken = (req, res, next) => {
  const token = req.cookies.eliget_token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
};

app.get('/api/check-username/:username', async (req, res) => {
  try {
    const existingUser = await User.findOne({ username: req.params.username.toLowerCase() });
    res.status(200).json({ available: !existingUser });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
});

app.post('/api/register', async (req, res) => {
  try {
    const { fullName, password } = req.body;
    const username = req.body.username.toLowerCase();
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "Username already taken!" });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ fullName, username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "Account created successfully!" });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const username = req.body.username.toLowerCase();
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found!" });
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials!" });
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('eliget_token', token, { httpOnly: true, secure: false, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(200).json({ message: "Login successful!", user: { id: user._id, fullName: user.fullName, username: user.username, profilePic: user.profilePic, coverPic: user.coverPic, badge: user.badge, bio: user.bio, website: user.website } });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('eliget_token');
  res.status(200).json({ message: "Logged out successfully" });
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user: { id: user._id, fullName: user.fullName, username: user.username, profilePic: user.profilePic, coverPic: user.coverPic, badge: user.badge, bio: user.bio, website: user.website } });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
});

// --- USER SETTINGS APIS ---
app.post('/api/user/update-profile/:userId', authenticateToken, async (req, res) => {
  try {
    const { fullName, bio, websiteTitle, websiteUrl } = req.body;
    
    // Trim and limit bio to 100 chars
    const safeBio = bio ? bio.substring(0, 100) : "";
    const website = {
      title: websiteTitle || "",
      url: websiteUrl || ""
    };

    const updatedUser = await User.findByIdAndUpdate(req.user.id, { fullName, bio: safeBio, website }, { new: true });
    res.status(200).json({ 
      message: "Profile updated successfully!", 
      user: { id: updatedUser._id, fullName: updatedUser.fullName, username: updatedUser.username, profilePic: updatedUser.profilePic, coverPic: updatedUser.coverPic, badge: updatedUser.badge, bio: updatedUser.bio, website: updatedUser.website } 
    });
  } catch (error) { res.status(500).json({ message: "Failed to update profile" }); }
});

app.post('/api/user/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ message: "Please provide old and new passwords." });
    if (newPassword.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters." });

    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect old password." });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) { res.status(500).json({ message: "Failed to change password" }); }
});

app.delete('/api/user/delete-account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await Post.deleteMany({ author: userId });
    await Comment.deleteMany({ author: userId });
    await Notification.deleteMany({ $or: [{ receiver: userId }, { sender: userId }] });
    await Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });
    await User.findByIdAndDelete(userId);
    
    res.clearCookie('eliget_token');
    res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) { res.status(500).json({ message: "Failed to delete account" }); }
});

app.post('/api/upload-avatar/:userId', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image provided." });
    const url = `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`;
    const response = await fetch(url, { method: 'POST', body: new URLSearchParams({ image: req.file.buffer.toString('base64') }) });
    const data = await response.json();
    if (data.success) {
      await User.findByIdAndUpdate(req.user.id, { profilePic: data.data.url });
      res.status(200).json({ message: "Avatar updated!", imageUrl: data.data.url });
    } else { res.status(500).json({ message: "ImgBB rejected image." }); }
  } catch (error) { res.status(500).json({ message: "Upload failed" }); }
});

app.post('/api/upload-cover/:userId', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image provided." });
    const url = `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`;
    const response = await fetch(url, { method: 'POST', body: new URLSearchParams({ image: req.file.buffer.toString('base64') }) });
    const data = await response.json();
    if (data.success) {
      await User.findByIdAndUpdate(req.user.id, { coverPic: data.data.url });
      res.status(200).json({ message: "Cover updated!", imageUrl: data.data.url });
    } else { res.status(500).json({ message: "ImgBB rejected image." }); }
  } catch (error) { res.status(500).json({ message: error.message || "Upload failed" }); }
});

app.get('/api/user/profile/:userId', authenticateToken, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId).select('-password');
    if (!targetUser) return res.status(404).json({ message: "User not found" });
    const currentUser = await User.findById(req.user.id);
    const isFollowing = currentUser.following.includes(req.params.userId);
    const isMutual = isFollowing && targetUser.following.includes(req.user.id);
    res.status(200).json({ user: targetUser, followersCount: targetUser.followers.length, followingCount: targetUser.following.length, isFollowing, isMutual });
  } catch (error) { res.status(500).json({ message: "Failed to fetch profile" }); }
});

app.post('/api/user/follow/:targetId', authenticateToken, async (req, res) => {
  try {
    if (req.user.id === req.params.targetId) return res.status(400).json({ message: "Cannot follow yourself" });
    const targetUser = await User.findById(req.params.targetId);
    const alreadyFollowing = targetUser.followers.includes(req.user.id);
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { following: req.params.targetId } });
    await User.findByIdAndUpdate(req.params.targetId, { $addToSet: { followers: req.user.id } });
    if (!alreadyFollowing) { await new Notification({ receiver: req.params.targetId, sender: req.user.id, type: 'follow' }).save(); }
    res.status(200).json({ message: "Followed successfully" });
  } catch (error) { res.status(500).json({ message: "Failed to follow" }); }
});

app.post('/api/user/unfollow/:targetId', authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $pull: { following: req.params.targetId } });
    await User.findByIdAndUpdate(req.params.targetId, { $pull: { followers: req.user.id } });
    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (error) { res.status(500).json({ message: "Failed to unfollow" }); }
});

app.get('/api/chats', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({ $or: [{ sender: req.user.id }, { receiver: req.user.id }] }).sort({ createdAt: -1 });
    const chatUsers = new Map();
    messages.forEach(msg => {
      const otherId = msg.sender.toString() === req.user.id ? msg.receiver.toString() : msg.sender.toString();
      if (!chatUsers.has(otherId)) { chatUsers.set(otherId, { lastMessage: msg.text, time: msg.createdAt, unread: (!msg.isRead && msg.receiver.toString() === req.user.id) }); }
      else if (!msg.isRead && msg.receiver.toString() === req.user.id) { chatUsers.get(otherId).unread = true; }
    });
    const result = [];
    for (let [userId, data] of chatUsers.entries()) {
      const user = await User.findById(userId).select('fullName username profilePic');
      if(user) result.push({ user, ...data });
    }
    res.status(200).json(result);
  } catch (error) { res.status(500).json({ message: "Failed to fetch chats" }); }
});

app.get('/api/chat/unread', authenticateToken, async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiver: req.user.id, isRead: false });
    res.status(200).json({ unreadCount: count });
  } catch (error) { res.status(500).json({ message: "Failed to fetch unread count" }); }
});

app.get('/api/chats/:targetUserId', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({ $or: [{ sender: req.user.id, receiver: req.params.targetUserId }, { sender: req.params.targetUserId, receiver: req.user.id }] }).sort({ createdAt: 1 });
    await Message.updateMany({ sender: req.params.targetUserId, receiver: req.user.id, isRead: false }, { isRead: true });
    res.status(200).json(messages);
  } catch (error) { res.status(500).json({ message: "Failed to fetch messages" }); }
});

app.post('/api/posts', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { content, postType } = req.body;
    let imageUrl = "";
    if (req.file) {
      const url = `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`;
      const response = await fetch(url, { method: 'POST', body: new URLSearchParams({ image: req.file.buffer.toString('base64') }) });
      const data = await response.json();
      if (data.success) imageUrl = data.data.url;
    }
    const newPost = new Post({ author: req.user.id, content, image: imageUrl, postType: postType || 'feed' });
    await newPost.save();
    res.status(201).json({ message: "Post created successfully!" });
  } catch (error) { res.status(500).json({ message: "Failed to create post" }); }
});

app.put('/api/posts/:postId', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body || {};
    if (!content) return res.status(400).json({ message: "Content required" });
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
    post.content = content;
    await post.save();
    res.status(200).json({ message: "Post updated successfully!" });
  } catch (error) { res.status(500).json({ message: "Failed to update post" }); }
});

app.delete('/api/posts/:postId', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
    await Post.findByIdAndDelete(req.params.postId);
    await Comment.deleteMany({ postId: req.params.postId });
    await Notification.deleteMany({ postId: req.params.postId });
    res.status(200).json({ message: "Post deleted successfully!" });
  } catch (error) { res.status(500).json({ message: "Failed to delete post" }); }
});

app.post('/api/posts/:postId/like', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const isLiked = post.likes.includes(req.user.id);
    if (isLiked) { post.likes.pull(req.user.id); } else { 
      post.likes.push(req.user.id); 
      if (post.author.toString() !== req.user.id) {
        await new Notification({ receiver: post.author, sender: req.user.id, type: 'like', postId: post._id }).save();
      }
    }
    await post.save();
    res.status(200).json({ likes: post.likes });
  } catch (error) { res.status(500).json({ message: "Failed to like post" }); }
});

app.post('/api/posts/:postId/view', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.postId, { $inc: { views: 1 } }, { new: true });
    res.status(200).json({ views: post.views });
  } catch (error) { res.status(500).json({ message: "Failed to count view" }); }
});

app.get('/api/posts/:postId/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId }).populate('author', 'fullName username profilePic badge').sort({ isPinned: -1, createdAt: -1 });
    res.status(200).json(comments);
  } catch (error) { res.status(500).json({ message: "Failed to fetch comments" }); }
});

app.post('/api/posts/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Comment cannot be empty" });
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const newComment = new Comment({ postId: req.params.postId, author: req.user.id, content });
    await newComment.save();
    if (post.author.toString() !== req.user.id) {
      await new Notification({ receiver: post.author, sender: req.user.id, type: 'comment', postId: post._id }).save();
    }
    const populatedComment = await Comment.findById(newComment._id).populate('author', 'fullName username profilePic badge');
    res.status(201).json(populatedComment);
  } catch (error) { res.status(500).json({ message: "Failed to add comment" }); }
});

app.delete('/api/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.author.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
    await Comment.findByIdAndDelete(req.params.commentId);
    res.status(200).json({ message: "Comment deleted" });
  } catch (error) { res.status(500).json({ message: "Failed to delete comment" }); }
});

app.post('/api/comments/:commentId/pin', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    const post = await Post.findById(comment.postId);
    if (post.author.toString() !== req.user.id) return res.status(403).json({ message: "Only the post author can pin comments" });
    if (!comment.isPinned) {
      const pinnedCount = await Comment.countDocuments({ postId: comment.postId, isPinned: true });
      if (pinnedCount >= 3) return res.status(400).json({ message: "You can only pin up to 3 comments" });
      comment.isPinned = true;
    } else { comment.isPinned = false; }
    await comment.save();
    res.status(200).json({ message: "Pin status updated", isPinned: comment.isPinned });
  } catch (error) { res.status(500).json({ message: "Failed to pin comment" }); }
});

app.get('/api/notifications/:userId', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ receiver: req.user.id }).populate('sender', 'fullName username profilePic').sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) { res.status(500).json({ message: "Failed to fetch notifications" }); }
});

app.get('/api/notifications/:userId/unread', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ receiver: req.user.id, isRead: false });
    res.status(200).json({ unreadCount: count });
  } catch (error) { res.status(500).json({ message: "Failed to fetch unread count" }); }
});

app.post('/api/notifications/:userId/read', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany({ receiver: req.user.id, isRead: false }, { isRead: true });
    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) { res.status(500).json({ message: "Failed to mark as read" }); }
});

app.get('/api/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let currentUser = null;
    if (req.cookies.eliget_token) {
      try {
        const decoded = jwt.verify(req.cookies.eliget_token, JWT_SECRET);
        currentUser = await User.findById(decoded.id);
      } catch (e) {}
    }

    const posts = await Post.find({ postType: { $ne: 'job' } }).populate('author', 'fullName username profilePic badge followers').sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

    for (let post of posts) {
      post.commentCount = await Comment.countDocuments({ postId: post._id });
      post.relationship = 'none';
      if (currentUser && post.author._id.toString() !== currentUser._id.toString()) {
        const isFollowing = currentUser.following.includes(post.author._id);
        const isFollower = post.author.followers.includes(currentUser._id);
        if (isFollowing && isFollower) post.relationship = 'mutual';
        else if (isFollowing) post.relationship = 'following';
        else if (isFollower) post.relationship = 'follower';
      }
    }
    res.status(200).json(posts);
  } catch (error) { res.status(500).json({ message: "Failed to fetch posts" }); }
});

app.get('/api/posts/jobs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = { postType: 'job' };
    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }

    const posts = await Post.find(query)
      .populate('author', 'fullName username profilePic badge')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    for (let post of posts) { 
      post.commentCount = await Comment.countDocuments({ postId: post._id }); 
    }
    res.status(200).json(posts);
  } catch (error) { res.status(500).json({ message: "Failed to fetch jobs" }); }
});

app.get('/api/posts/user/:userId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) return res.status(400).json({ message: "Invalid User ID" });
    const posts = await Post.find({ author: req.params.userId }).sort({ createdAt: -1 }).lean();
    for (let post of posts) { post.commentCount = await Comment.countDocuments({ postId: post._id }); }
    res.status(200).json(posts);
  } catch (error) { res.status(500).json({ message: "Failed to fetch user posts" }); }
});

app.use('/api', (req, res) => { res.status(404).json({ message: "API Route Not Found" }); });
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ message: "Multer Error: " + err.message });
  res.status(500).json({ message: "Internal Server Error", error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Eliget Server running on port ${PORT}`));

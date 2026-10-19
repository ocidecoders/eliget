const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: "" }, 
  image: { type: String, default: "" },
  videoLink: { type: String, default: "" },
  postType: { type: String, enum: ['feed', 'job'], default: 'feed' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 }
}, { timestamps: true });

const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
module.exports = Post;

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected to DB. Removing badges from users with < 100 followers...");
    const users = await User.find({});
    let count = 0;
    
    for (let user of users) {
        if (user.followers.length < 100 && user.badge === true) {
            user.badge = false;
            await user.save();
            count++;
            console.log(`Removed badge from @${user.username} (Followers: ${user.followers.length})`);
        }
    }
    
    console.log(`\n✅ Done! Removed badges from ${count} users.`);
    process.exit();
}).catch(err => {
    console.error("Error:", err);
    process.exit(1);
});

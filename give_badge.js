require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// এখানে আপনার অ্যাকাউন্টের ইউজারনেম দিন
const myUsername = 'ocidecoders'; 

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const user = await User.findOne({ username: myUsername });
    if (user) {
        user.badge = true;
        await user.save();
        console.log(`✅ Badge added to @${user.username} successfully!`);
    } else {
        console.log("User not found!");
    }
    process.exit();
});

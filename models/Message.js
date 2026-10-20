const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: "" },
  audioUrl: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  isRead: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false } // নতুন: মেসেজ এডিট হয়েছে কিনা
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);

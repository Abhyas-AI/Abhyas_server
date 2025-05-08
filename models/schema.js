const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userUUID: { type: String, required: true, unique: true },
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    otp: { type: String, default: null },
    verified: { type: Boolean, default: false },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null }
});
const User = mongoose.model('User', userSchema);

module.exports = User;
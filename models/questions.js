const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    userUUID: {
        type: String,
        required: true,
        unique: true
    },
    questions: { 
        type: [String], 
        required: true 
    }
});

module.exports = mongoose.model('Question', questionSchema);
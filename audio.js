const mongoose = require('mongoose');

const audioSchema = new mongoose.Schema({
    userUUID: {
        type: String,
        required: true,
        unique: true
    },
    responses: [{
        question: String,
        answer: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
});

module.exports = mongoose.model('Audio', audioSchema);
const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    userUUID: {
        type: String,
        required: true,
        unique: true
    },
    evaluations: [{
        question: String,
        grammar: Number,
        confidence: Number,
        technical: Number,
        Communication: Number,
        bodylang: Number,
        facialconfidence: Number,
        feedback: String
    }],
    grammar_score: Number,
    confidence_score: Number,
    technical_score: Number,
    Communication_score: Number,
    bodylang_score: Number,
    facialconfidence_score: Number,
    resume_feedback: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Result', resultSchema);
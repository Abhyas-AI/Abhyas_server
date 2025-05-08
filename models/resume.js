const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
    userUUID: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String
    },
    email: {
        type: String
    },
    phoneno: {
        type: String
    },
    skills: {
        type: [String],
        default: []
    },
    experience: {
        type: String
    },
    education: {
        type: String
    }
});

const Resume = mongoose.model("Resume", resumeSchema);
module.exports = Resume;
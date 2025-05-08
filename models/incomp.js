const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema({
    userUUID: {
        type: String,
        required: true,
        unique: true
    },
    domain: {
        type: String
    },
    experience: {
        type: String
    },
    interviewFormat: {
        type: String
    },
    duration: {
        type: String
    }
});

const Interview = mongoose.model("Interview", interviewSchema);
module.exports = Interview;
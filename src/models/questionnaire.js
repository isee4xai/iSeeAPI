const mongoose = require('mongoose');

const questionnaireschema = new mongoose.Schema({
    // _id: String,
    name: String,
    dimension: String,
    questions: [{
        id: String,
        content: String,
        responseType: String,
        dimension: String,
        answer: [String],
        responseOptions: [{
            content: String,
            id: String
        }],
        required: Boolean,
        completed: Boolean,
        validators: {
            min: Number,
            max: Number,
        }
    }],
}, { strict: false, timestamps: true })

module.exports = mongoose.model('questionnaires', questionnaireschema);
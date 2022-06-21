const mongoose = require('mongoose');

const interactionschema = new mongoose.Schema({
    name: String,
    dimension: String,
    personaId: String,
    usecaseId: String,
    questions: [{
        id: String,
        content: String,
        responseType: String,
        dimension: String,
        answer: [String],
        responseOptions: [{
            val: String,
        }],
        required: Boolean,
        completed: Boolean,
        validators: {
            min: Number,
            max: Number,
        }
    }],
}, { strict: false, timestamps: true })

module.exports = mongoose.model('interaction', interactionschema);
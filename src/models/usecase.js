
// For now we will only define the required and main attributes of iSee Onto

const mongoose = require('mongoose');

const personaSchema = new mongoose.Schema({
    details: {
        type: Object
    },
    completed: {
        type: Boolean
    },
    intents: {
        type: Array
    }
}, { strict: false, timestamps: true });

const usecaseSchema = new mongoose.Schema({
    name: {
        required: true,
        type: String
    },
    goal: {
        type: String
    },
    domain: {
        type: String
    },
    status: {
        type: String
    },
    settings: {
        type: Object
    },
    stats: {
        type: Object
    },
    personas: {
        type: [personaSchema]
    }
}, {
    strict: false,
    timestamps: true
})

module.exports = mongoose.model('Persona', personaSchema)

module.exports = mongoose.model('Usecase', usecaseSchema)
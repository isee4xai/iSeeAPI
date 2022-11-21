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


module.exports = mongoose.model('Persona', personaSchema)

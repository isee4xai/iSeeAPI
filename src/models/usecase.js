const mongoose = require('mongoose');

// For now we will only define the required and main attributes of iSee Onto
const dataSchema = new mongoose.Schema({
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
        type: Array
    }
}, {
    strict: false,
    timestamps: true
})

module.exports = mongoose.model('Usecase', dataSchema)
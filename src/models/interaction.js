
// For now we will save everything - Later optimise for required fields etc.
const mongoose = require('mongoose');

// Duplicated on persona.js file 
const interactionSchema = new mongoose.Schema({
    interaction: {
        type: Object
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    usecase: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usecase'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
}, { strict: false, timestamps: true });


module.exports = mongoose.model('Interaction', interactionSchema)
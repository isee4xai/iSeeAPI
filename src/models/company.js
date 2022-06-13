
// For now we will only define the required and main attributes of iSee Onto

const mongoose = require('mongoose');
const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    active: {
        type: Boolean,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    }
}, { strict: true, timestamps: true });

module.exports = {
    model: mongoose.model('Company', companySchema),
    schema: companySchema
}

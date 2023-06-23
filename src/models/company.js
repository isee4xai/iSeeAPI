
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
    },
    // users: [{ type: Object, ref: 'User' }]

}, {
    strict: true, timestamps: true, toJSON: { virtuals: true }, toObject: {virtuals: true}
});

companySchema.virtual('users_count', {
    ref: 'User',
    localField: '_id',
    foreignField: 'company',
    count: true
})

companySchema.virtual('usecases_count', {
    ref: 'Usecase',
    localField: '_id',
    foreignField: 'company',
    count: true
})

module.exports = {
    model: mongoose.model('Company', companySchema),
    schema: companySchema
}


// For now we will only define the required and main attributes of iSee Onto

const mongoose = require('mongoose');
const Company = require('./company');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: '',
        unique: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    password: {
        type: String,
        default: '',
        select: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    access: {
        type: String, // end_user, design_user, admin 
        default: ''
    },
    type: {
        type: String,
        default: 'User'
    },
    usecases: [{ // Only for end_user access
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usecase'
    }]
}, { strict: false, timestamps: true,toJSON: { virtuals: true }, toObject: {virtuals: true} });

module.exports = mongoose.model('User', userSchema)
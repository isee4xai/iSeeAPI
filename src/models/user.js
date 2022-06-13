
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
        default: ''
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    password: {
        type: String,
        default: ''
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
        default: 'User' // End User, Design User, Admin 
    }
}, { strict: false, timestamps: true });

module.exports = mongoose.model('User', userSchema)
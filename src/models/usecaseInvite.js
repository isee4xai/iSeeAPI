
const mongoose = require('mongoose');

const UsecaseInvite = new mongoose.Schema({
    name: {
        type: String
    },
    key: {
        type: String
    },
    published: {
        type: Boolean
    },
    usecase: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usecase'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    endusers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
}, { strict: false, timestamps: true });


module.exports = mongoose.model('UsecaseInvite', UsecaseInvite)
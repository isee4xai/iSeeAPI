
// To support the BT Editor Queries

const mongoose = require('mongoose');
const treeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    usecase: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usecase'
    },
    persona: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Persona'
    },
    intent: {
        type: String,
    },
}, { strict: false, timestamps: true });

// Duplicate the ID field.
treeSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

treeSchema.set('toJSON', {
    virtuals: true
});
module.exports = mongoose.model('Tree', treeSchema)

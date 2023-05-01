
const Usecase = require('../models/usecase');
incrementVersion = (req, res, next) => {
    var update = { $inc: { version: 1 } };
    Usecase.findOneAndUpdate({ _id: req.params.id, published: true }, update).exec((err, usecase) => {
        next();
        return;
    });
};

const increment = {
    incrementVersion,
};

module.exports = increment;

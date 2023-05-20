const Usecase = require("../models/usecase");
const { v4 } = require("uuid");
const User = require("../models/user");


module.exports.list = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        // Limit the fields visible for endusers
        const data = await Usecase.find({ '_id': { $in: user.usecases }, published: true },
            { name: 1, goal: 1, version: 1 })
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error });
    }
};

const Usecase = require("../models/usecase");
const User = require("../models/user");
const { v4 } = require("uuid");
const Company = require("../models/company");
var bcrypt = require("bcryptjs");

module.exports.company_list = async (req, res) => {
    try {
        const data = await Company.model.find({}).populate(['users_count', 'usecases_count']);
        res.json(data)
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }

};

module.exports.company_create = async (req, res) => {
    const data = new Company.model(req.body)
    try {
        const dataToSave = await data.save();
        res.status(200).json(dataToSave)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}

module.exports.company_get = async (req, res) => {
    try {
        const company_id = req.params.id
        const data = await Company.model.findById(company_id);
        const usecases = await Usecase.find({ company: data });
        const users = await User.find({ company: data });

        const response = { company: data, users: users, usecases: usecases }

        res.json(response)
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
};

module.exports.company_update = async (req, res) => {
    try {
        const id = req.params.id;
        const updatedData = req.body;
        const options = { new: true };

        const result = await Company.model.findByIdAndUpdate(
            id, updatedData, options
        )
        if (result) {
            res.send(result)
        } else {
            res.status(404).json({ message: "Company not found" })
        }
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}


module.exports.company_user_add = async (req, res) => {
    try {
        const id = req.params.id;

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            company: id,
            access: req.body.access,
            password: bcrypt.hashSync(req.body.password, 8)
        });

        const save = await user.save();

        if (save) {
            const user_res = {
                name: user.name,
                email: user.email,
                company: user.company,
                access: user.access
            }
            res.send(user_res)
        } else {
            res.status(404).json({ message: "Company not found" })
        }
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}

module.exports.company_user_edit = async (req, res) => {

    try {
        const id = req.params.id;
        const updatedData = req.body;
        const options = { new: true };

        const result = await User.findByIdAndUpdate(
            updatedData._id, updatedData, options
        )
        if (result) {
            res.send(result)
        } else {
            res.status(404).json({ message: "User not found" })
        }
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}

module.exports.company_user_edit_pass = async (req, res) => {

    try {
        const id = req.params.id;
        const updatedData = {
            password: bcrypt.hashSync(req.body.password, 8)
        };
        const options = { new: true };

        const result = await User.findByIdAndUpdate(
            req.body._id, updatedData, options
        )
        if (result) {
            res.send({ user: result._id })
        } else {
            res.status(404).json({ message: "User not found" })
        }
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}

const Usecase = require('../models/usecase');
const User = require('../models/user');
const Company = require('../models/company');
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

// THESE ARE TEMPORARY ADMIN APIS
module.exports.admin_createDesignUserWithCompany = async (req, res) => {
    try {

        if (req.body.ISEE_ADMIN_KEY == process.env.ISEE_ADMIN_KEY) {
            const company = new Company.model({
                name: req.body.company.name,
                active: true,
                type: req.body.company.type
            });

            const save_company = await company.save();

            const user = new User({
                name: req.body.name,
                email: req.body.email,
                company: save_company,
                access: "design_user",
                password: bcrypt.hashSync(req.body.password, 8)
            });

            const save = await user.save();

            const user_res = {
                name: user.name,
                email: user.email,
                company: user.company,
                access: user.access
            }

            res.status(200).json(user_res)
        } else {
            console.log("Unauth access");
            res.status(400).json({ message: "unauth" })
        }
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}

module.exports.admin_companies = async (req, res) => {
    if (req.body.ISEE_ADMIN_KEY == process.env.ISEE_ADMIN_KEY) {
        try {
            const data = await Company.model.find({});
            res.json(data)
        }
        catch (error) {
            res.status(500).json({ message: error.message })
        }
    } else {
        console.log("Unauth access");
        res.status(400).json({ message: "unauth" })
    }
}

module.exports.admin_all_users = async (req, res) => {
    if (req.body.ISEE_ADMIN_KEY == process.env.ISEE_ADMIN_KEY) {
        try {
            const data = await User.find({});
            res.json(data)
        }
        catch (error) {
            res.status(500).json({ message: error.message })
        }
    } else {
        console.log("Unauth access");
        res.status(400).json({ message: "unauth" })
    }
}

module.exports.admin_add_user = async (req, res) => {
    if (req.body.ISEE_ADMIN_KEY == process.env.ISEE_ADMIN_KEY) {

        try {
            const user = new User({
                name: req.body.name,
                email: req.body.email,
                company: req.body.company,
                access: "design_user",
                password: bcrypt.hashSync(req.body.password, 8)
            });

            const save = await user.save();

            const user_res = {
                name: user.name,
                email: user.email,
                company: user.company,
                access: user.access
            }

            res.status(200).json(user_res)
        }
        catch (error) {
            res.status(500).json({ message: error.message })
        }
    } else {
        console.log("Unauth access");
        res.status(400).json({ message: "unauth" })
    }

}


module.exports.login = async (req, res) => {
    try {

        const user = await User.findOne({
            email: req.body.email
        }).populate('company');

        if (!user) {
            return res.status(404).send({ message: "User Not found." });
        }

        var passwordIsValid = bcrypt.compareSync(
            req.body.password,
            user.password
        );

        if (!passwordIsValid) {
            return res.status(401).send({
                accessToken: null,
                message: "Invalid Password!"
            });
        }

        var token = jwt.sign({ _id: user._id, companyId: user.company._id }, JWT_SECRET, {
            expiresIn: 86400 // 24 hours - Update Later
        });

        const user_res = {
            name: user.name,
            email: user.email,
            company: user.company,
            access: user.access,
            token: token
        }

        res.status(200).json(user_res)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}


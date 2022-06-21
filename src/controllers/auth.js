const Usecase = require('../models/usecase');
const User = require('../models/user');
const Company = require('../models/company');
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

module.exports.createDesignUserWithCompany = async (req, res) => {
    try {

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
    }
    catch (error) {
        res.status(400).json({ message: error.message })
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


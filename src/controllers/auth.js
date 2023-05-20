const Usecase = require('../models/usecase');
const User = require('../models/user');
const Company = require('../models/company');
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const usecaseInvite = require('../models/usecaseInvite');
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

module.exports.admin_all_usecases = async (req, res) => {
    if (req.body.ISEE_ADMIN_KEY == process.env.ISEE_ADMIN_KEY) {
        try {
            const data = await Usecase.find({});
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

module.exports.admin_change_usecase_ownership = async (req, res) => {
    if (req.body.ISEE_ADMIN_KEY == process.env.ISEE_ADMIN_KEY) {
        try {
            const id = req.body.usecase;
            const updatedData = { "company": req.body.company };
            const options = { new: false };

            const result = await Usecase.findByIdAndUpdate(id, updatedData, options);
            if (result) {
                res.send(result);
            } else {
                res.status(404).json({ message: "Usecase not found" });
            }
        } catch (error) {
            console.log(error)
            res.status(400).json({ message: error.message })
        }
    } else {
        console.log("Unauth access");
        res.status(400).json({ message: "unauth" })
    }
}

module.exports.admin_change_user_company = async (req, res) => {
    if (req.body.ISEE_ADMIN_KEY == process.env.ISEE_ADMIN_KEY) {
        try {
            const id = req.body.user;
            const updatedData = { "company": req.body.company };
            const options = { new: false };

            const result = await User.findByIdAndUpdate(id, updatedData, options);
            if (result) {
                res.send(result);
            } else {
                res.status(404).json({ message: "User not found" });
            }
        } catch (error) {
            console.log(error)
            res.status(400).json({ message: error.message })
        }
    } else {
        console.log("Unauth access");
        res.status(400).json({ message: "unauth" })
    }
}


module.exports.registerWithInvite = async (req, res) => {
    // Validate Invite Code
    const invite = await usecaseInvite.findOne({ key: req.body.inviteKey, published: true });

    if (invite) {
        const usecase = await Usecase.findById(invite.usecase);
        const existingUser = await User.findOne({ email: req.body.email });
        if (!existingUser) {
            try {
                const user = new User({
                    name: req.body.name,
                    email: req.body.email,
                    company: usecase.company,
                    access: "end_user",
                    password: bcrypt.hashSync(req.body.password, 8)
                });

                user.usecases.push(usecase._id)
                const save = await user.save();
                console.log("Created User with Invite Code: ", invite)

                // Append the User to Invite Code
                invite.endusers.push(user._id);
                const invite_save = await invite.save();

                res.status(200).json({status: true});
            }
            catch (error) {
                res.status(500).json({ message: error.message })
            }
        } else {
            console.log("Existing User Email");
            res.status(400).json({ message: "Existing Email! You already have an account with iSee" })
        }
    } else {
        console.log("Invalid Invite Code");
        res.status(400).json({ message: "Invalid Invite Code" })
    }
}


module.exports.login = async (req, res) => {
    try {

        const user = await User.findOne({
            email: req.body.email
        }).select('+password').populate('company');

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
            expiresIn: '24h' // 24 hours - Update Later
        });

        const user_res = {
            _id: user._id,
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


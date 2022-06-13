const User = require('../models/user');
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const Usecase = require('../models/usecase');
const SECRET = process.env.SECRET;

verifyToken = (req, res, next) => {
    let token = req.headers["x-access-token"];
    if (!token) {
        return res.status(403).send({ message: "Invalid Access token!" });
    }
    jwt.verify(token, SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "Unauthorized! Please check your Access Token" });
        }
        req.userId = decoded._id;
        next();
    });
};

isAdmin = (req, res, next) => {
    User.findById(req.userId).exec((err, user) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
        if (!user) {
            res.status(500).send({ message: "User Could not be found!" });
            return;
        }

        if (user.access === "admin") {
            next();
            return;
        }
        res.status(403).send({ message: "Require Admin Role!" });
        return;
    });
};

isDesignUser = (req, res, next) => {
    User.findById(req.userId).exec((err, user) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        if (!user) {
            res.status(500).send({ message: "User Could not be found!" });
            return;
        }

        if (user.access === "design_user") {
            req.companyId = user.company;
            next();
            return;
        }
        res.status(403).send({ message: "Require Design User Role!" });
        return;
    });
};

isCompanyUsecase = (req, res, next) => {
    console.log(req.params.id)
    Usecase.findById(req.params.id).exec((err, usecase) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        if (!usecase) {
            res.status(404).send({ message: "Usecase Could not be found!" });
            return;
        }

        if (usecase.company === req.companyId) {
            next();
            return;
        }
        res.status(403).send({ message: "Invalid Company Ownership!" });
        return;
    });
};

const authJwt = {
    verifyToken,
    isDesignUser,
    isCompanyUsecase,
    isAdmin
};
module.exports = authJwt;

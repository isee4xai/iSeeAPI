const User = require('../models/user');
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const { TokenExpiredError } = jwt;

const Usecase = require('../models/usecase');
const JWT_SECRET = process.env.JWT_SECRET;

const catchAuth = (err, res) => {
    if (err instanceof TokenExpiredError) {
      return res.status(401).send({ message: "Unauthorized! Please check your Access Token!" });
    }
    return res.status(401).send({ message: "Unauthorized API Call! You need to be logged in to access this resource" });
  }

verifyToken = (req, res, next) => {
    let token = req.headers["x-access-token"];
    if (!token) {
        return res.status(403).send({ message: "Invalid Access token!" });
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("Invalid Access token - "+req.method+" - "+ req.originalUrl)
            return catchAuth(err, res);
        }
        console.log(req.method+" - "+ req.originalUrl)
        req.userId = decoded._id;
        next();
    });
};

isAdminUser = (req, res, next) => {
    User.findById(req.userId).exec((err, user) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        if (!user) {
            res.status(500).send({ message: "User Could not be found!" });
            return;
        }

        if (user.access === "admin_user") {
            req.companyId = user.company;
            next();
            return;
        }
        res.status(403).send({ message: "Require Admin User Role!" });
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

isEndUser = (req, res, next) => {
    User.findById(req.userId).exec((err, user) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        if (!user) {
            res.status(500).send({ message: "User Could not be found!" });
            return;
        }

        if (user.access === "end_user") {
            req.companyId = user.company;
            next();
            return;
        }
        res.status(403).send({ message: "Require End User Role!" });
        return;
    });
};

isDesignUserOrEndUser = (req, res, next) => {
    User.findById(req.userId).exec((err, user) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        if (!user) {
            res.status(500).send({ message: "User Could not be found!" });
            return;
        }

        if (user.access === "end_user" || user.access === "design_user"  ) {
            req.companyId = user.company;
            next();
            return;
        }
        
        res.status(403).send({ message: "Require End User Role!" });
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
    isEndUser,
    isAdminUser,
    isDesignUserOrEndUser
};
module.exports = authJwt;

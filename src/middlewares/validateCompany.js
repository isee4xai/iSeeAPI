
const Usecase = require('../models/usecase');
isCompanyUsecase = (req, res, next) => {
    Usecase.findById(req.params.id).exec((err, usecase) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
        if (!usecase) {
            res.status(404).send({ message: "Usecase Could not be found!" });
            return;
        }
        if (usecase.company.toString() === req.companyId.toString()) {
            next();
            return;
        }
        res.status(403).send({ message: "Invalid Company Ownership!" });
        return;
    });
};

const validateCompany = {
    isCompanyUsecase,
};
module.exports = validateCompany;

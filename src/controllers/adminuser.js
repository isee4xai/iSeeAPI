const Usecase = require("../models/usecase");
const { v4 } = require("uuid");
const Company = require("../models/company");


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
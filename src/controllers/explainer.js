// const Tree = require("../models/tree");
const axios = require('axios');
const EXPLAINER_URL = process.env.EXPLAINER_URL;

module.exports.list = async (req, res) => {
    try {
        const response = await axios.get(EXPLAINER_URL+'/Explainers')
        res.json(response.data)
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}


module.exports.getMeta = async (req, res) => {
    try {
        const explainer_id = req.query.id
        const response = await axios.get(EXPLAINER_URL+'/'+explainer_id)
        res.json(response.data)
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}


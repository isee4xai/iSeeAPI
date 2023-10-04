// const Tree = require("../models/tree");
const axios = require('axios');
const EXPLAINERAPI_URL = process.env.EXPLAINERAPI_URL;
const ONTOAPI_URL = process.env.ONTOAPI_URL;

module.exports.list = async (req, res) => {
    try {
        const response = await axios.get(EXPLAINERAPI_URL + '/Explainers')
        res.json(response.data)
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}


module.exports.getMeta = async (req, res) => {
    try {
        const explainer_id = req.query.id
        const response = await axios.get(EXPLAINERAPI_URL + '/' + explainer_id)
        res.json(response.data)
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports.create = async (req, res) => {
    try {

        const config = {
            data: req.body,
            ISEE_ADMIN_KEY: process.env.ISEE_ADMIN_KEY
        }
        console.log("[INFO] Adding New Explainer Method");
        const response = await axios.post(ONTOAPI_URL + 'explainers/insert', config)
        console.log("[INFO] Response -",response.data);

        res.json(response.data)
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}


module.exports.similarities = async (req, res) => {
    try {
        console.log(ONTOAPI_URL + 'explainers/similarities');
        const response = await axios.get(ONTOAPI_URL + 'explainers/similarities')
        res.json(response.data);
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}
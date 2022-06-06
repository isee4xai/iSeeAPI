const Usecase = require('../models/usecase');

module.exports.create = async (req, res) => {
    const data = new Usecase(req.body)

    try {
        const dataToSave = await data.save();
        res.status(200).json(dataToSave)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}

module.exports.get = async (req, res) => {
    try {
        const data = await Usecase.findById(req.params.id);
        res.json(data)
    }
    catch (error) {
        res.status(500).json({ message: error })
    }
}

module.exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const updatedData = req.body;
        const options = { new: true };

        const result = await Usecase.findByIdAndUpdate(
            id, updatedData, options
        )
        res.send(result)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}

module.exports.updateSettings = async (req, res) => {
    try {
        const id = req.params.id;
        const updatedData = { "settings": req.body.settings };
        const options = { new: true };

        const result = await Usecase.findByIdAndUpdate(
            id, updatedData, options
        )
        if (result) {
            res.send(result)
        } else {
            res.status(404).json({ message: "Usecase not found" })
        }
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}


module.exports.list = async (req, res) => {
    try {
        const data = await Usecase.find({});
        res.json(data)
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}


module.exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await Usecase.findByIdAndDelete(id)
        res.send(`Document with ${data.name} has been deleted..`)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}



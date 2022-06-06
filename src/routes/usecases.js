const express = require('express');

const router = express.Router()
const Usecase = require('../models/usecase');

// Create
router.post('/', async (req, res) => {
    const data = new Usecase(req.body)

    try {
        const dataToSave = await data.save();
        res.status(200).json(dataToSave)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

// Get one by ID
router.get('/:id', async (req, res) => {
    try {
        const data = await Usecase.findById(req.params.id);
        res.json(data)
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
})

//Update by ID
router.patch('/:id', async (req, res) => {
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
})

//Get all
router.get('/', async (req, res) => {
    try {
        const data = await Usecase.find({});
        res.json(data)
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
})

//Delete by ID
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const data = await Usecase.findByIdAndDelete(id)
        res.send(`Document with ${data.name} has been deleted..`)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})


module.exports = router;
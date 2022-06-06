const Usecase = require('../models/usecase');

module.exports.add = async (req, res) => {
    const data = new Usecase(req.body)

    try {
        const usecase = await Usecase.findById(req.params.id);
        usecase.personas.push(data);
        const save = await usecase.save();
        res.status(200).json(save)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}

module.exports.updateDetails = async (req, res) => {
    try {
        const usecase = await Usecase.findById(req.params.id);

        const personaId = req.params.personaId;
        console.log("personaId", personaId)

        let persona = usecase.personas.id(personaId);
        persona.details = req.body;

        const save = await usecase.save();
        res.status(200).json(save)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}

module.exports.delete = async (req, res) => {
    try {
        const usecaseId = req.params.id;
        const usecase = await Usecase.findById(usecaseId);
        const personaId = req.params.personaId;
        console.log("personaId", personaId)

        // Add Validation Later - Non existent
        usecase.personas.id(personaId).remove();

        const save = await usecase.save();
        res.status(200).json(save)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}


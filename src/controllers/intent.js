const Usecase = require('../models/usecase');

module.exports.add = async (req, res) => {
    try {
        const usecase = await Usecase.findById(req.params.id);
        let persona = usecase.personas.id(req.params.personaId);

        persona.intents.push(req.body)
        
        const save = await usecase.save();
        res.status(200).json(save)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}

module.exports.delete = async (req, res) => {
    try {
        const usecase = await Usecase.findById(req.params.id);
        let persona = usecase.personas.id(req.params.personaId);

        persona.intents = persona.intents.filter((intent) => intent.id != req.params.intentId)
        
        const save = await usecase.save();
        res.status(200).json(save)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}

module.exports.update = async (req, res) => {
    try {
        const usecase = await Usecase.findById(req.params.id);
        let persona = usecase.personas.id(req.params.personaId);

        const intentIndex = persona.intents.map((e) => e.id).indexOf(req.params.intentId);
        
        persona.intents[intentIndex] = req.body;
    

        const save = await usecase.save();
        res.status(200).json(save)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}

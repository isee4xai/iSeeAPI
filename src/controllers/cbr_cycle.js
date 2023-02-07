const Usecase = require('../models/usecase');
var axios = require('axios');
const Tree = require('../models/tree');
const { v4: uuidv4, v4 } = require("uuid");

const CBRAPI_URL = process.env.CBRAPI_URL;
const CBRAPI_PROJECT = process.env.CBRAPI_PROJECT;
const NUM_QUERY_FIELDS = 8

module.exports.query = async (req, res) => {
    try {
        const usecase = await Usecase.findById(req.params.id);
        let persona = usecase.personas.id(req.params.personaId);
        const intentIndex = persona.intents.map((e) => e.id).indexOf(req.params.intentId);

        let selected_intent = persona.intents[intentIndex]
        let request_body = {
            "data": [
                {
                    "name": "Name",
                    "type": "String",
                    "similarity": "None",
                    "weight": 0,
                    "unknown": false,
                    "strategy": "Best Match"
                },
                {
                    "name": "DatasetType",
                    "type": "String",
                    "similarity": "Equal",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match",
                    "value": usecase.settings.dataset_type
                },
                {
                    "name": "AITask",
                    "type": "Ontology Concept",
                    "similarity": "Path-based",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match",
                    "value": usecase.settings.ai_task[usecase.settings.ai_task.length - 1] 
                },
                {
                    "name": "AIMethod",
                    "type": "Ontology Concept",
                    "similarity": "Path-based",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match",
                    "value": usecase.settings.ai_method[0][usecase.settings.ai_method[0].length-1]
                },
                {
                    "name": "Portability",
                    "type": "String",
                    "similarity": "Equal",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match",
                },
                {
                    "name": "ExplainerConcurrentness",
                    "type": "String",
                    "similarity": "Equal",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match",
                    "value": "http://www.w3id.org/iSeeOnto/explainer#post-hoc" // CHANGE LATER
                },
                {
                    "name": "ExplanationPresentation",
                    "type": "String",
                    "similarity": "Equal",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match",
                    "value": "http://semanticscience.org/resource/SIO_001194" // CHANGE LATER
                },
                {
                    "name": "ExplanationScope",
                    "type": "String",
                    "similarity": "Equal",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match",
                },
                {
                    "name": "ExplanationTarget",
                    "type": "String",
                    "similarity": "Equal",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match",
                },
                {
                    "name": "TechnicalFacilities",
                    "type": "Categorical",
                    "similarity": "Query Intersection",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match"
                },
                {
                    "name": "AIKnowledgeLevel",
                    "type": "String",
                    "similarity": "Equal",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match",
                    "value": persona.details.ai_knowledge_level
                },
                {
                    "name": "DomainKnowledgeLevel",
                    "type": "String",
                    "similarity": "Equal",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match",
                    "value": persona.details.domain_knowledge_level

                },
                {
                    "name": "UserQuestionTarget",
                    "type": "String",
                    "similarity": "Equal",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match"
                },
                {
                    "name": "UserIntent",
                    "type": "String",
                    "similarity": "Equal",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match",
                    "value": selected_intent.name
                },
                {
                    "name": "Solution",
                    "type": "Object",
                    "similarity": "None",
                    "weight": 0,
                    "unknown": false,
                    "strategy": "Best Match"
                }
            ],
            "topk": 4,
            "globalSim": "Weighted Sum",
            "explanation": true,
            "projectId": CBRAPI_PROJECT
        }

        var config = {
            method: 'post',
            url: CBRAPI_URL + 'retrieve',
            headers: {
                'Accept': 'application/json'
            },
            data: request_body
        };

        const response = await axios(config)
        let strategies = []
        await Promise.all(response.data.bestK.map(async (strategy) => {
            // console.log()
            // let data = new Tree(strategy.Solution)
            const solution_bt = {
                "name": "Tree",
                "description": "",
                "path": "b3projects-" + v4(),
                "data": strategy.Solution
            }
            let methods = []
            solution_bt.data.trees.forEach(t => {
                for (var n in t.nodes) {
                    if (t.nodes[n].Concept == "Explanation Method") {
                        methods.push(t.nodes[n].Instance)
                    }
                }
            })
            let data = new Tree(solution_bt)
            let dataToSave = await data.save();

            let s = {
                name: strategy.Name,
                dataset_type: strategy.DatasetType,
                ai_task: strategy.AITask,
                ai_method: strategy.AIMethod,
                ai_knowledge_level: strategy.AIKnowledgeLevel,
                domain_knowledge_level: strategy.DomainKnowledgeLevel,
                score__: strategy.score__,
                percentage: ((strategy.score__) / NUM_QUERY_FIELDS * 100).toFixed(2),
                match_explanation: strategy.match_explanation,
                tree: dataToSave._id,
                selected: false,
                methods: methods,
                id: "strat-" + v4()
            }
            strategies.push(s)
        }));

        strategies.sort(function (a, b) {
            var keyA = a.score__,
                keyB = b.score__;
            if (keyA < keyB) return 1;
            if (keyA > keyB) return -1;
            return 0;
        });

        let index = 1;
        strategies.forEach( strat=> {
            strat.name = "Strategy "+index;
            strat.index = index;
            index ++;
        })

        selected_intent.strategies = strategies
        selected_intent.strategy_selected = false
        persona.intents[intentIndex] = selected_intent;

        const save = await usecase.save();

        res.status(200).json(strategies)

    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}

module.exports.setDefault = async (req, res) => {
    try {
        const usecase = await Usecase.findById(req.params.id);
        let persona = usecase.personas.id(req.params.personaId);
        const intentIndex = persona.intents.map((e) => e.id).indexOf(req.params.intentId);

        let selected_intent = persona.intents[intentIndex]

        selected_intent.strategies.forEach(function (strat) {
            if (strat.id == req.params.strategyId) {
                strat.selected = true;
                selected_intent.strategy_selected = strat.tree;
            }
        })

        persona.intents[intentIndex] = selected_intent;

        const save = await usecase.save();

        res.status(200).json(selected_intent)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}

const Usecase = require('../models/usecase');
var axios = require('axios');
const Tree = require('../models/tree');
const { v4: uuidv4, v4 } = require("uuid");

const CBRAPI_URL = process.env.CBRAPI_URL;
const CBRAPI_PROJECT = process.env.CBRAPI_PROJECT;
const NUM_QYERY_FIELDS = 3

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
                    "strategy": "Best Match"
                },
                {
                    "name": "AITask",
                    "type": "Ontology Concept",
                    "similarity": "Path-based",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match",
                    "value": usecase.settings.ai_task[0]
                },
                {
                    "name": "AIMethod",
                    "type": "Ontology Concept",
                    "similarity": "Path-based",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match",
                    "value": usecase.settings.ai_method[0][0]
                },
                {
                    "name": "Portability",
                    "type": "String",
                    "similarity": "Equal",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match"
                },
                {
                    "name": "ExplainerConcurrentness",
                    "type": "String",
                    "similarity": "Equal",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match"
                },
                {
                    "name": "ExplanationPresentation",
                    "type": "String",
                    "similarity": "Equal",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match"
                },
                {
                    "name": "ExplanationScope",
                    "type": "String",
                    "similarity": "Equal",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match"
                },
                {
                    "name": "ExplanationTarget",
                    "type": "String",
                    "similarity": "Equal",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match"
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
                    "strategy": "Best Match"
                },
                {
                    "name": "DomainKnowledgeLevel",
                    "type": "String",
                    "similarity": "Equal",
                    "weight": 1,
                    "unknown": false,
                    "strategy": "Best Match"
                },
                {
                    "name": "UserQuestion",
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

            // let data = new Tree(strategy.Solution)
            const temp = {
                "name": "Tree",
                "description":"",
                "data": {
                    "version": "0.1.0",
                    "scope": "project",
                    "selectedTree": "23bb1a7b-a4b3-449e-8c82-4e6f3e0cb327",
                    "trees": [
                        {
                            "version": "0.1.0",
                            "scope": "tree",
                            "id": "23bb1a7b-a4b3-449e-8c82-4e6f3e0cb327",
                            "Instance": "Explanation Experience",
                            "description": "",
                            "root": "ff978c28-7448-49af-acb0-bed28400292f",
                            "properties": {},
                            "nodes": {
                                "ff978c28-7448-49af-acb0-bed28400292f": {
                                    "id": "ff978c28-7448-49af-acb0-bed28400292f",
                                    "Concept": "Sequence",
                                    "Instance": "Sequence",
                                    "description": "",
                                    "properties": {},
                                    "display": {
                                        "x": 0,
                                        "y": 96
                                    },
                                    "firstChild": {
                                        "Id": "66dd0924-7b59-41c2-b690-a2f613840c68",
                                        "Next": null
                                    }
                                },
                                "66dd0924-7b59-41c2-b690-a2f613840c68": {
                                    "id": "66dd0924-7b59-41c2-b690-a2f613840c68",
                                    "Concept": "Explanation Method",
                                    "Instance": "/Tabular/DisCERN",
                                    "description": "",
                                    "properties": {},
                                    "display": {
                                        "x": 0,
                                        "y": 216
                                    },
                                    "params": {
                                        "desired_class": "",
                                        "feature_attribution_method": "",
                                        "attributed_instance": ""
                                    }
                                }
                            },
                            "display": {
                                "camera_x": 720,
                                "camera_y": 394.5,
                                "camera_z": 1,
                                "x": 0,
                                "y": 0
                            }
                        }
                    ],
                    "custom_nodes": []
                }
            }
            let methods = []
            temp.trees.forEach(t => {
                for (var n in t.nodes) {
                    if (t.nodes[n].Concept == "Explanation Method") {
                        methods.push(t.nodes[n].Instance)
                    }
                }
            })
            let data = new Tree(temp)
            let dataToSave = await data.save();

            let s = {
                name: strategy.Name,
                score__: strategy.score__,
                percentage: ((strategy.score__) / NUM_QYERY_FIELDS * 100).toFixed(2),
                match_explanation: strategy.match_explanation,
                tree: dataToSave._id,
                selected: false,
                methods: methods,
                id: "strat-" + v4()
            }
            strategies.push(s)
        }));

        selected_intent.strategies = strategies
        persona.intents[intentIndex] = selected_intent;

        const save = await usecase.save();

        res.status(200).json(strategies)

    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}

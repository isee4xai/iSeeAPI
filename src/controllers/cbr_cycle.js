const Usecase = require('../models/usecase');
var axios = require('axios');
const Tree = require('../models/tree');
const { v4: uuidv4, v4 } = require("uuid");
const Interaction = require("../models/interaction");
const analyticsUtil = require('./analytics-util');

const ONTOAPI_URL = process.env.ONTOAPI_URL;

const CBRAPI_URL = process.env.CBRAPI_URL;
const CBRAPI_PROJECT = process.env.CBRAPI_PROJECT;
const CBRAPI_TOKEN = process.env.CBRAPI_TOKEN;
const NUM_QUERY_FIELDS = 8

module.exports.query = async (req, res) => {
    try {
        const usecase = await Usecase.findById(req.params.id);
        let persona = usecase.personas.id(req.params.personaId);
        const intentIndex = persona.intents.map((e) => e.id).indexOf(req.params.intentId);

        let selected_intent = persona.intents[intentIndex]

        // To support load more - Always increments of 3
        let updated_strategy_topk = 3;
        if (req.body.loadMore) {
            updated_strategy_topk += selected_intent.strategy_topk
        }

        selected_intent.strategy_topk = updated_strategy_topk;

        let request_body = generateQueryObject(usecase, persona, selected_intent)

        var config = {
            method: 'post',
            url: CBRAPI_URL + 'retrieve',
            headers: {
                'Accept': 'application/json',
                'Authorization': CBRAPI_TOKEN,
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
                "usecase": usecase._id,
                "persona": persona._id,
                "intent": selected_intent.id,
                "description": "",
                "path": "b3projects-" + v4(),
                "status": strategy.Status,
                "outcome": strategy.Outcome,
                "data": strategy.Solution
            }
            let methods = []
            solution_bt.data.trees.forEach(t => {
                for (var n in t.nodes) {
                    if (t.nodes[n].Concept == "Explanation Method") {
                        methods.push(t.nodes[n].Instance);
                    }
                    // To support the new BT structure - beta
                    // if (t.nodes[n].Concept == "User Question") {
                    //     var updated_questions = ""
                    //     selected_intent.questions.forEach(qTemp => {
                    //         updated_questions += qTemp.text + ";"
                    //     });
                    //     t.nodes[n].params.Question.value = updated_questions
                    //     // console.log(t.nodes[n])
                    // }
                }
            })
            // const new_tree = await retrieve_transform(strategy.Solution, selected_intent.name, selected_intent.questions.map(t => t.text));
            // console.log("new tree", JSON.stringify(new_tree));
            // console.log(JSON.stringify(solution_bt));
            let data = new Tree(solution_bt);
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
                id: "strat-" + v4(),
                cbr_ref: strategy.Name,  // For debuggining purpose
                status: strategy.Status,
                outcome: strategy.Outcome
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
        strategies.forEach(strat => {
            strat.name = "Strategy " + index;
            strat.index = index;
            index++;
        })

        selected_intent.strategies = strategies;
        selected_intent.strategy_selected = false;
        persona.intents[intentIndex] = selected_intent;

        const save = await usecase.save();

        res.status(200).json(strategies)

    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}

module.exports.reuse = async (req, res) => {
    try {
        const usecase = await Usecase.findById(req.params.id);
        let persona = usecase.personas.id(req.params.personaId);
        const intentIndex = persona.intents.map((e) => e.id).indexOf(req.params.intentId);

        let selected_intent = persona.intents[intentIndex]

        let request_body = generateQueryObject(usecase, persona, selected_intent)

        var config = {
            method: 'post',
            url: CBRAPI_URL + 'retrieve',
            headers: {
                'Accept': 'application/json',
                'Authorization': CBRAPI_TOKEN,
            },
            data: request_body
        };

        // Do a CBR Retrieval to get topk
        const cbr_response = await axios(config)
        const neighbours = cbr_response.data.bestK

        // Prepare Reuse Query
        let userQuestions = []
        selected_intent.questions.forEach(function (q) {
            userQuestions.push(q.text)
        })
        var config = {
            method: 'post',
            url: CBRAPI_URL + 'reuse',
            headers: {
                'Accept': 'application/json',
                'Authorization': CBRAPI_TOKEN,
            },
            data: {
                "reuse_type": "_isee",
                "reuse_feature": "transform",
                "neighbours": neighbours,
                "query_case": {
                    "UserIntent": selected_intent.name,
                    "UserQuestion": userQuestions
                }
            }
        };

        const reuse_response = await axios(config)
        console.log("reuse_response")
        console.log(reuse_response.data)

        // Change Solution Strategy to the reuse retrieval
        let recommendedCase = cbr_response.data.recommended;
        recommendedCase.Solution = reuse_response.data.adapted_solution;
        console.log("final recommended")
        console.log(recommendedCase)

        let strategies = selected_intent.strategies;

        const solution_bt = {
            "name": "Tree",
            "description": "",
            "usecase": usecase._id,
            "persona": persona._id,
            "intent": selected_intent.id,
            "path": "b3projects-" + v4(),
            "data": recommendedCase.Solution
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
            name: recommendedCase.Name,
            dataset_type: recommendedCase.DatasetType,
            ai_task: recommendedCase.AITask,
            ai_method: recommendedCase.AIMethod,
            ai_knowledge_level: recommendedCase.AIKnowledgeLevel,
            domain_knowledge_level: recommendedCase.DomainKnowledgeLevel,
            score__: 1,
            percentage: "reuse",
            match_explanation: recommendedCase.match_explanation,
            tree: dataToSave._id,
            selected: false,
            methods: methods,
            id: "strat-" + v4(),
            cbr_ref: recommendedCase.Name  // For debuggining purpose
        }
        strategies.push(s)

        let index = 1;
        strategies.forEach(strat => {
            strat.name = "Strategy " + index;
            strat.index = index;
            index++;
        })

        selected_intent.strategies = strategies;
        selected_intent.strategy_selected = false;
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
            } else {
                strat.selected = false;
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

module.exports.retain = async (req, res) => {
    try {
        const usecase = await Usecase.findById(req.params.id);
        console.log("usecase.id", usecase.id, "usecase_version", usecase.version);
        const contents = await Interaction.find({ usecase: usecase.id, usecase_version: usecase.version }, ['user', 'createdAt', 'usecase_version', 'interaction']).populate('user').populate('interaction').sort({ createdAt: "desc" });
        console.log("contents", JSON.stringify(contents));
        const outcome = analyticsUtil.caseOutcome(contents)
        console.log("outcome", JSON.stringify(outcome));
        let responses = []
        const all_mapping = await Promise.all(
            await usecase.personas.map(async function (persona) {
                await Promise.all(await persona.intents.map(async intent => {
                    const outcome_filtered = analyticsUtil.filterOutcome(outcome, persona.details.name, intent.name);
                    console.log("outcome_filtered", JSON.stringify(outcome_filtered), persona.details.name, intent.name);
                    const solution = await Tree.findById(intent.strategy_selected);
                    const caseObject = generateCaseObject(usecase, persona, intent, outcome_filtered, solution);
                    console.log("retaining case:", JSON.stringify(caseObject));
                    const request_body = {
                        "data":caseObject,
                        "projectId": CBRAPI_PROJECT
                    };
            
                    var config = {
                        method: 'post',
                        url: CBRAPI_URL + 'retain',
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': CBRAPI_TOKEN,
                        },
                        data: request_body
                    };
            
                    const response = await axios(config);
                    responses.push(response.data);
                }));
            }));

        console.log("retain responses", responses);
        res.status(200).json(responses);
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}

async function retrieve(usecase, persona, intent) {
    try {
        let request_body = generateQueryObject(usecase, persona, intent);
        var config = {
            method: 'post',
            url: CBRAPI_URL + 'retrieve',
            headers: {
                'Accept': 'application/json',
                'Authorization': CBRAPI_TOKEN,
            },
            data: request_body
        };

        const response = await axios(config)
        let topTrees = []
        await Promise.all(response.data.bestK.map(async (strategy) => {
            const solution_bt = {
                "name": "Tree",
                score__: strategy.score__,
                "usecase": usecase._id,
                "persona": persona._id,
                "intent": intent.id,
                "description": "",
                "path": "b3projects-" + v4(),
                "status": strategy.Status,
                "outcome": strategy.Outcome,
                "data": strategy.Solution
            }
            topTrees.push(solution_bt)
        }));
        return topTrees;
    }
    catch (error) {
        return { message: error.message }
    }
}

module.exports.explainerApplicability = async (req, res) => {
    try {
        const usecase = await Usecase.findById(req.params.id);
        const reuse_support_props = await axios.get(ONTOAPI_URL + 'reuse/ReuseSupport');
        if (!usecase) {
            res.status(404).json({ message: "Not Found! Check the usecase ID" })
        }

        var config = {
            method: 'post',
            url: CBRAPI_URL + 'reuse',
            headers: {
                'Accept': 'application/json',
                'Authorization': CBRAPI_TOKEN,
            },
            data: {
                "reuse_type": "_isee",
                "reuse_feature": "applicability",
                "query_case": usecase,
                "ontology_props": reuse_support_props.data,
                "explain": 'true'
            }
        };

        const response = await axios(config);
        res.status(200).json(response.data);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports.substituteExplainer = async (req, res) => {
    try {
        const usecase = await Usecase.findById(req.params.id);
        const query_explainer = req.body.explainer;
        const criteria = req.body.criteria;
        const reuse_support_props = await axios.get(ONTOAPI_URL + 'reuse/ReuseSupport');

        if (!usecase) {
            res.status(404).json({ message: "Not Found! Check the usecase ID" })
        }

        var config = {
            method: 'post',
            url: CBRAPI_URL + 'reuse',
            headers: {
                'Accept': 'application/json',
                'Authorization': CBRAPI_TOKEN,
            },
            data: {
                "reuse_type": "_isee",
                "reuse_feature": "substitute",
                "query_case": usecase,
                "ontology_props": reuse_support_props.data,
                "explain": 'true',
                "query_explainer": query_explainer,
                "criteria": criteria
            }
        };

        const response = await axios(config)
        res.status(200).json(response.data)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}

module.exports.substituteSubtree = async (req, res) => {
    try {
        const usecase = await Usecase.findById(req.params.id);
        if (!usecase) {
            res.status(404).json({ message: "Not Found! Check the usecase ID" })
        }

        const tree = await Tree.findOne({ _id: req.body.treeId, usecase: usecase });
        let persona = usecase.personas.id(tree.persona);
        const intentIndex = persona.intents.map((e) => e.id).indexOf(tree.intent);
        let selected_intent = persona.intents[intentIndex];
        selected_intent.strategy_topk = 10;
        const neighbours = await retrieve(usecase, persona, selected_intent);

        const reuse_support_props = await axios.get(ONTOAPI_URL + 'reuse/ReuseSupport');

        var config = {
            method: 'post',
            url: CBRAPI_URL + 'reuse',
            headers: {
                'Accept': 'application/json',
                'Authorization': CBRAPI_TOKEN,
            },
            data: {
                "reuse_type": "_isee",
                "reuse_feature": "substitute",
                "query_tree": req.body.tree,
                "query_subtree": req.body.subtreeId,
                "query_case": usecase,
                "ontology_props": reuse_support_props.data,
                "neighbours": neighbours,
                "criteria": req.body.criteria,
                "explain": 'true',
                "k": req.body.k
            }
        };

        const response = await axios(config);
        console.log(response.data);
        res.status(200).json(response.data)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
}

function generateQueryObject(usecase, persona, intent) {
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
                "strategy": "NN value",
                "filterTerm": "=",
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
                "value": usecase.settings.ai_method[0][usecase.settings.ai_method[0].length - 1]
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
                "value": intent.name
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
        "topk": intent.strategy_topk,
        "globalSim": "Weighted Sum",
        "explanation": true,
        "projectId": CBRAPI_PROJECT
    }
    return request_body;
}

function generateCaseObject(usecase, persona, intent, outcome, solution) {
    let outcome_status = outcome == {} ? "http://www.w3id.org/iSeeOnto/explanationexperience#Not_Evaluated" : "http://www.w3id.org/iSeeOnto/explanationexperience#Evaluated";
    const a_case = {
        "id": v4().replace(/-/g, ''),
        "Name": "http://www.w3id.org/iSeeOnto/explanationexperience#"+usecase.name.split(" ").join("")+ "" + persona.details.name + "" + intent.label,
        "Version": usecase.version,
        "DatasetType": usecase.settings.dataset_type,
        "AITask": usecase.settings.ai_task[usecase.settings.ai_task.length - 1],
        "AIMethod": usecase.settings.ai_method[0][usecase.settings.ai_method.length - 1],
        "Portability": "http://www.w3id.org/iSeeOnto/explainer#model-agnostic",
        "ExplainerConcurrentness": "http://www.w3id.org/iSeeOnto/explainer#post-hoc",
        "ExplanationScope": "http://www.w3id.org/iSeeOnto/explainer#local",
        "ExplanationTarget": "http://www.w3id.org/iSeeOnto/explainer#prediction",
        "ExplanationPresentation": "http://semanticscience.org/resource/SIO_00119",
        "UserIntent": intent.name,
        "TechnicalFacilities": ["http://www.w3id.org/iSeeOnto/user#Touchpad", 
                                "http://www.w3id.org/iSeeOnto/user#ScreenDisplay"],
        "UserDomain": usecase.domain[0],
        "AIKnowledgeLevel": persona.details.ai_knowledge_level,
        "DomainKnowledgeLevel": persona.details.domain_knowledge_level,
        "UserQuestion": intent.questions.map(t => t.text),
        "UserQuestionTarget": intent.questions.map(t => t.target),
        "Solution": solution.data,
        "Status": outcome_status,
        "Outcome": outcome, 
    };
    return a_case;
}

async function retrieve_transform(solution, intent, questions){
    var config = {
        method: 'post',
        url: CBRAPI_URL + 'reuse',
        headers: {
            'Accept': 'application/json',
            'Authorization': CBRAPI_TOKEN,
        },
        data: {
            "reuse_type": "_isee",
            "reuse_feature": "transform",
            "neighbours": [solution],
            "query_case": {
                "UserIntent": intent,
                "UserQuestion": questions,
            },
            "acceptance_threshold": 0.01
        }
    };

    const reuse_response = await axios(config);
    console.log("reuse pairings", JSON.stringify(reuse_response.pairings));
    return reuse_response.data.adapted_solution;
}
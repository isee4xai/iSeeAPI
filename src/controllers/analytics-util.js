const moment = require('moment');

function diffTimes(start, end) {
    const timeDifferenceInSeconds = moment(end).diff(moment(start), 'seconds');
    return timeDifferenceInSeconds;
}


function evalQuestions(content) {
    const qCounts = {};
    const dimQ = {};
    const execs = content.interaction.executions;

    const evalExecs = execs.filter(exe => exe["https://www.w3id.org/iSeeOnto/BehaviourTreeExecution#enacted"]
        && exe["https://www.w3id.org/iSeeOnto/BehaviourTreeExecution#enacted"]["class"] === "https://www.w3id.org/iSeeOnto/BehaviourTree#EvaluationQuestionNode");

    for (const ev of evalExecs) {
        const gen = ev["http://www.w3.org/ns/prov#generated"]["https://www.w3id.org/iSeeOnto/BehaviourTree#properties"]["https://www.w3id.org/iSeeOnto/BehaviourTree#hasDictionaryMember"];

        const q = gen.filter(g => g["https://www.w3id.org/iSeeOnto/BehaviourTree#pairKey"] === "question")
            .map(g => g["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]["content"]);

        const d = gen.filter(g => g["https://www.w3id.org/iSeeOnto/BehaviourTree#pairKey"] === "question")
            .map(g => g["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]["dimension"]);

        const v = gen.filter(g => g["https://www.w3id.org/iSeeOnto/BehaviourTree#pairKey"] === "variable")
            .map(g => g["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]["content"]);

        if (q.length > 0 && v.length > 0 && d.length > 0 && d[0]) {
            qCounts[q[0]] = v[0];
        }

        if (q.length > 0 && d.length > 0 && d[0]) {
            if (!dimQ[d[0]]) {
                dimQ[d[0]] = [];
            }
            dimQ[d[0]].push(q[0]);
        }
    }

    return [qCounts, dimQ];
}

function explainers(content) {
    const eCounts = {};
    const nodes = content.interaction.nodes;
    const executions = content.interaction.executions;

    for (const exe of executions) {
        if (exe["https://www.w3id.org/iSeeOnto/BehaviourTreeExecution#enacted"]["class"] !== "https://www.w3id.org/iSeeOnto/BehaviourTree#ExplainerNode") {
            continue;
        }

        const node = nodes.find(n => n.instance === exe["https://www.w3id.org/iSeeOnto/BehaviourTreeExecution#enacted"]["instance"]);

        if (node) {
            const endpoint = node["https://www.w3id.org/iSeeOnto/BehaviourTree#properties"]["https://www.w3id.org/iSeeOnto/BehaviourTree#hasDictionaryMember"]
                .filter(p => p["https://www.w3id.org/iSeeOnto/BehaviourTree#pairKey"] === 'endpoint')
                .map(p => p["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]);

            if (endpoint.length > 0) {
                const endpointKey = JSON.stringify(endpoint[0]); // Convert endpoint to a string for use as a key
                eCounts[endpointKey] = (eCounts[endpointKey] || 0) + 1;
            }
        }
    }

    return eCounts;
}


function intentQuestions(content) {
    const qCounts = {};
    const executions = content.interaction.executions;

    for (const exe of executions) {
        if (exe["https://www.w3id.org/iSeeOnto/BehaviourTreeExecution#enacted"]["class"] !== "https://www.w3id.org/iSeeOnto/BehaviourTree#NeedQuestionNode") {
            continue;
        }

        const question = exe["http://www.w3.org/ns/prov#generated"]["https://www.w3id.org/iSeeOnto/BehaviourTree#properties"]["https://www.w3id.org/iSeeOnto/BehaviourTree#hasDictionaryMember"]
            .filter(p => p["https://www.w3id.org/iSeeOnto/BehaviourTree#pairKey"] === 'variable')
            .map(p => p["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]["content"]);

        if (question.length > 0 && question[0]) {
            qCounts[question[0]] = (qCounts[question[0]] || 0) + 1;
        }
    }

    return qCounts;
}


function userTimes(content, nodeTypes = null) {
    const times = [];
    const executions = content.interaction.executions;
    const nodes = content.interaction.nodes;

    for (const exe of executions) {
        if (!nodeTypes.includes(exe["https://www.w3id.org/iSeeOnto/BehaviourTreeExecution#enacted"]["class"])) {
            continue;
        }

        let data = null;

        switch (exe["https://www.w3id.org/iSeeOnto/BehaviourTreeExecution#enacted"]["class"]) {
            case "https://www.w3id.org/iSeeOnto/BehaviourTree#ExplainerNode":
                const node = nodes.find(n => n.instance === exe["https://www.w3id.org/iSeeOnto/BehaviourTreeExecution#enacted"]["instance"]);
                if (node) {
                    const endpoint = node["https://www.w3id.org/iSeeOnto/BehaviourTree#properties"]["https://www.w3id.org/iSeeOnto/BehaviourTree#hasDictionaryMember"]
                        .filter(p => p["https://www.w3id.org/iSeeOnto/BehaviourTree#pairKey"] === 'endpoint')
                        .map(p => p["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]);
                    if (endpoint.length > 0) {
                        data = JSON.stringify(endpoint[0]);
                    }
                }
                break;

            case "https://www.w3id.org/iSeeOnto/BehaviourTree#NeedQuestionNode":
            case "https://www.w3id.org/iSeeOnto/BehaviourTree#TargetTypeQuestionNode":
            case "https://www.w3id.org/iSeeOnto/BehaviourTree#TargetQuestionNode":
                const dictionaryMember = exe["http://www.w3.org/ns/prov#generated"]["https://www.w3id.org/iSeeOnto/BehaviourTree#properties"]["https://www.w3id.org/iSeeOnto/BehaviourTree#hasDictionaryMember"][1];
                if (dictionaryMember) {
                    data = dictionaryMember["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]["content"];
                }
                break;

            case "https://www.w3id.org/iSeeOnto/BehaviourTree#PersonaQuestionNode":
                const personaContent = exe["http://www.w3.org/ns/prov#generated"]["https://www.w3id.org/iSeeOnto/BehaviourTree#properties"]["https://www.w3id.org/iSeeOnto/BehaviourTree#hasDictionaryMember"][1]["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]["content"];
                const DOMParser = new (require('xmldom').DOMParser)();
                const parsedXML = DOMParser.parseFromString(personaContent, 'text/xml');
                data = parsedXML.textContent;
                break;

            case "https://www.w3id.org/iSeeOnto/BehaviourTree#EvaluationQuestionNode":
                const content1 = exe["http://www.w3.org/ns/prov#generated"]["https://www.w3id.org/iSeeOnto/BehaviourTree#properties"]["https://www.w3id.org/iSeeOnto/BehaviourTree#hasDictionaryMember"][0]["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]["content"];
                const content2 = exe["http://www.w3.org/ns/prov#generated"]["https://www.w3id.org/iSeeOnto/BehaviourTree#properties"]["https://www.w3id.org/iSeeOnto/BehaviourTree#hasDictionaryMember"][1]["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]["content"];
                data = content1 + ", " + content2;
                break;

            default:
                break;
        }

        const start = exe["http://www.w3.org/ns/prov#startedAtTime"]["@value"];
        const end = exe["http://www.w3.org/ns/prov#endedAtTime"]["@value"];
        const diff = diffTimes(start, end);

        times.push([exe["https://www.w3id.org/iSeeOnto/BehaviourTreeExecution#enacted"]["class"], diff, data]);
    }

    return times;
}

function intentQuestionsList(contents) {
    const qCountsAgg = {};

    for (const c in contents) {
        const qCounts = intentQuestions(contents[c]);

        for (const q in qCounts) {
            qCountsAgg[q] = (qCountsAgg[q] || 0) + qCounts[q];
        }
    }

    return {"question_count":qCountsAgg};
}


function userTimesList(contents) {
    const nodeTypes = [
        "https://www.w3id.org/iSeeOnto/BehaviourTree#GreeterNode",
        "https://www.w3id.org/iSeeOnto/BehaviourTree#PersonaQuestionNode",
        "https://www.w3id.org/iSeeOnto/BehaviourTree#TargetTypeQuestionNode",
        "https://www.w3id.org/iSeeOnto/BehaviourTree#TargetQuestionNode",
        "https://www.w3id.org/iSeeOnto/BehaviourTree#NeedQuestionNode",
        "https://www.w3id.org/iSeeOnto/BehaviourTree#ExplainerNode",
        "https://www.w3id.org/iSeeOnto/BehaviourTree#EvaluationQuestionNode",
        "https://www.w3id.org/iSeeOnto/BehaviourTree#CompleteNode"
    ];

    const uTimesAgg = {};

    for (const c in contents) {
        uTimesAgg[contents[c].user] = userTimes(contents[c], nodeTypes);
    }

    return {"person_times":uTimesAgg};
}


function explainersList(contents) {
    const eCountsAgg = {};

    for (const c in contents) {
        const eCounts = explainers(contents[c]);

        for (const e in eCounts) {
            eCountsAgg[e] = (eCountsAgg[e] || 0) + eCounts[e];
        }
    }

    return {"explainer_count":eCountsAgg};
}


function evalQuestionsList(contents) {
    const qCountsList = {};
    const dimQList = {};

    for (const c in contents) {
        const [qCounts, dimQ] = evalQuestions(contents[c]);


        for (const q in qCounts) {
            qCountsList[q] = qCountsList[q] || [];
            qCountsList[q].push(qCounts[q]);
        }

        for (const d in dimQ) {
            dimQList[d] = dimQList[d] || new Set();
            for (const item of dimQ[d]) {
                dimQList[d].add(item);
            }
        }
    }

    return {"question_count":qCountsList, "dimension_questions":dimQList};
}


function personasList(contents){
    const pContentsList = {};
    for (const c in contents) {
        for (const exe of contents[c].interaction.executions) {
            if (exe["https://www.w3id.org/iSeeOnto/BehaviourTreeExecution#enacted"]["class"] === "https://www.w3id.org/iSeeOnto/BehaviourTree#PersonaQuestionNode") {
                const personaContent = exe["http://www.w3.org/ns/prov#generated"]["https://www.w3id.org/iSeeOnto/BehaviourTree#properties"]["https://www.w3id.org/iSeeOnto/BehaviourTree#hasDictionaryMember"][1]["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_object"]["content"];
                const DOMParser = new (require('xmldom').DOMParser)();
                const parsedXML = DOMParser.parseFromString(personaContent, 'text/xml');
                const data = parsedXML.getElementsByClassName("persona-name")[0].textContent;
                pContentsList[data] = pContentsList[data] || [];
                pContentsList[data].push(contents[c]);
                break;
            }
        }
    }
    return pContentsList
}

function interactionCounts(contents){
    const start = moment(contents[contents.length-1].createdAt);
    const end = moment(contents[0].createdAt);
    let currentDay = moment(start);
    const intCounts = {};
    // Iterate through each day
    while (currentDay.isSameOrBefore(end, 'day')) {
        const currentDate = currentDay.format('YYYY-MM-DD');
        const count = contents.filter(item => moment(item.createdAt).isSame(currentDay, 'day')).length;
        intCounts[currentDate] = count;
        currentDay.add(1, 'day');
    }
    return intCounts;
}

function analytics(contents) {
    const results = {}
    const pContents = personasList(contents);
    results["interactions_per_date"] = interactionCounts(contents);

    for (const p in pContents){
        const pContent = pContents[p];
        results[p] = {};
        results[p]["evaluations"] = evalQuestionsList(pContent);
        results[p]["intents"] = intentQuestionsList(pContent);
        results[p]["explainers"] = explainersList(pContent);
        results[p]["experiences"] = userTimesList(pContent);
    }
    return results;
}


module.exports = {
    analytics,
};
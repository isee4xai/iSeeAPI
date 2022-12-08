const Usecase = require("../models/usecase");
const Tree = require("../models/tree");
const axios = require('axios');
var FormData = require('form-data');
var fs = require('fs');
const MODELAPI_URL = process.env.MODELAPI_URL;

module.exports.create = async (req, res) => {
  const data = new Usecase(req.body)
  try {
    data.company = req.companyId;
    data.user = req.userId;

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
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

module.exports.getCaseStructure = async (req, res) => {
  try {
    const data = await Usecase.findById(req.params.id);
    const response = await axios.get('https://raw.githubusercontent.com/isee4xai/iSeeCases/main/case-structure.json');
    const casestructure = response.data;
    var build_json = JSON.stringify(casestructure);

    const reponse_bases = await axios.get('https://raw.githubusercontent.com/isee4xai/iSeeCases/main/bases.json');
    const bases = reponse_bases.data;
    var base_list = [];
    for (k in bases){
      var base = {
        "key": k,
        "val": bases[k]
      };
      base_list.push(base);
    }

    base_list.forEach(function (change) {
      build_json = build_json.replaceAll(change['key'], change['val'])
    });

    // need to remove spaces from the use case name
    build_json = build_json.replaceAll("<casename>", data["name"].replaceAll(" ", "_"));

    //basics updates
    var conv = [
      {
        "key": "<AITaskGoal>",
        "val": "goal",
        "sub": ""
      },
      {
        "key": "<Dataset_Feature_Quantity_Range>",
        "val": "num_features",
        "sub": "settings"
      },
      {
        "key": "<Dataset_Instance_Quantity_Range>",
        "val": "num_instances",
        "sub": "settings"
      },
      {
        "key": "<DatasetType>",
        "val": "dataset_type",
        "sub": "settings"
      },
      {
        "key": "<DataType>",
        "val": "data_type",
        "sub": "settings"
      },
    ]

    conv.forEach(function (change) {
      if (change["sub"] != "") {
        build_json = build_json.replaceAll(change['key'], data[change["sub"]][change['val']])
      } else {
        build_json = build_json.replaceAll(change['key'], data[change['val']])
      }
    });

    build_json = build_json.replaceAll('<Portability>', 'http://www.w3id.org/iSeeOnto/explainer#model-agnostic');
    build_json = build_json.replaceAll('<Concurrentness>', 'http://www.w3id.org/iSeeOnto/explainer#post-hoc');
    build_json = build_json.replaceAll('<Presentation>', 'http://semanticscience.org/resource/SIO_001194');
    build_json = build_json.replaceAll('<ExplanationScope>', 'http://www.w3id.org/iSeeOnto/explainer#local');
    build_json = build_json.replaceAll('<ExplanationTarget>', 'http://www.w3id.org/iSeeOnto/explainer#prediction');
    //TODO system recommendations as a list
    build_json = build_json.replaceAll('<SystemRecommendation>', '');

    build_json = JSON.parse(build_json);

    //AITask keeps the last item
    var ai_tasks = data["settings"]["ai_task"];
    build_json["http://www.w3id.org/iSeeOnto/explanationexperience#hasDescription"]["http://www.w3id.org/iSeeOnto/explanationexperience#hasAIModel"]["http://www.w3id.org/iSeeOnto/aimodel#solves"]["classes"] = [ai_tasks[ai_tasks.length-1]];

    //AIMethod:list keeps a list of last items
    var ai_methods = data["settings"]["ai_method"];
    var methods = [];
    ai_methods.forEach(function (method) {
      methods.push(method[method.length-1]);
    });
    build_json["http://www.w3id.org/iSeeOnto/explanationexperience#hasDescription"]["http://www.w3id.org/iSeeOnto/explanationexperience#hasAIModel"]["http://www.w3id.org/iSeeOnto/explainer#utilises"]["classes"] = methods;

    // AIModelAssessements todo once 
    var all_cases = []
    // console.log(build_json);
    // Now do persona by persona
    Promise.all(
     await data.personas.map(async function(persona){
      await Promise.all(await persona.intents.map(async intent => {
        // console.log(intent);
        var new_case = JSON.stringify(build_json)
        
        new_case = new_case.replaceAll('<UserGroup>', persona.details.name);
        new_case = new_case.replaceAll('<Intent>', intent.name);
        new_case = new_case.replaceAll('<AIKnowledgeLevel>', persona.details.ai_knowledge_level);
        new_case = new_case.replaceAll('<DomainKnowledgeLevel>', persona.details.domain_knowledge_level);
        new_case = JSON.parse(new_case);

        const selected_tree = await Tree.findById(intent.strategy_selected);

        new_case["http://www.w3id.org/iSeeOnto/explanationexperience#hasSolution"] = selected_tree.data

        var asks  = []
        intent.questions.forEach(question => {
          var ask = {...new_case["http://www.w3id.org/iSeeOnto/explanationexperience#hasDescription"]["http://www.w3id.org/iSeeOnto/explanationexperience#hasUserGroup"]["https://purl.org/heals/eo#asks"][0]};
          ask["http://semanticscience.org/resource/SIO_000300"] = question.text;
          ask["instance"] = ask["instance"]+"_"+question.id;
          if (question.target == "https://purl.org/heals/eo#SystemRecommendation"){
            ask["http://www.w3id.org/iSeeOnto/user#hasQuestionTarget"] = new_case["http://www.w3id.org/iSeeOnto/explanationexperience#hasDescription"]["http://www.w3id.org/iSeeOnto/explanationexperience#hasAIModel"]["http://www.w3id.org/iSeeOnto/aimodel#solves"]["http://semanticscience.org/resource/SIO_000229"][0];
          }
          else if (question.target == "https://purl.org/heals/eo#ArtificialIntelligenceMethod"){
            ask["http://www.w3id.org/iSeeOnto/user#hasQuestionTarget"] = new_case["http://www.w3id.org/iSeeOnto/explanationexperience#hasDescription"]["http://www.w3id.org/iSeeOnto/explanationexperience#hasAIModel"]["http://www.w3id.org/iSeeOnto/explainer#utilises"];
          }
          else if (question.target == "http://www.w3id.org/iSeeOnto/aimodel#Dataset"){
            ask["http://www.w3id.org/iSeeOnto/user#hasQuestionTarget"] = new_case["http://www.w3id.org/iSeeOnto/explanationexperience#hasDescription"]["http://www.w3id.org/iSeeOnto/explanationexperience#hasAIModel"]["http://www.w3id.org/iSeeOnto/aimodel#trainedOn"][0];
          }
          asks.push(ask);
        });
        new_case["http://www.w3id.org/iSeeOnto/explanationexperience#hasDescription"]["http://www.w3id.org/iSeeOnto/explanationexperience#hasUserGroup"]["https://purl.org/heals/eo#asks"] =  asks;

        var evals  = []
        var index = 0;
        intent.evaluation.questions.forEach(question => {
          var ask = {...new_case["http://www.w3id.org/iSeeOnto/explanationexperience#hasOutcome"]["http://linkedu.eu/dedalo/explanationPattern.owl#isBasedOn"][0]};
          ask["http://www.w3.org/2000/01/rdf-schema#comment"] = question.content;
          ask["instance"] = ask["instance"]+"_"+question.id;
          ask["http://www.w3id.org/iSeeOnto/userevaluation#sequenceIndex"] = index++;
          switch (question.responseType){
            case "Likert":
              ask["classes"] = ["http://www.w3id.org/iSeeOnto/userevaluation#Likert_Scale_Question"];
              break;
            default:
              ask["classes"] = ["http://www.w3id.org/iSeeOnto/userevaluation#Likert_Scale_Question"];
          }
          ask["http://sensornet.abdn.ac.uk/onts/Qual-O#measures"]["instance"] = question.dimension;

          var ops = [];
          question.responseOptions.forEach(option=> {
            var op = {...new_case["http://www.w3id.org/iSeeOnto/explanationexperience#hasOutcome"]["http://linkedu.eu/dedalo/explanationPattern.owl#isBasedOn"][0]["http://www.w3id.org/iSeeOnto/userevaluation#hasResponseOptions"]["http://semanticscience.org/resource/SIO_000974"][0]};
            op["instance"] = op["instance"]+"_"+option.id;
            op["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_literal"] = option.content;
            op["https://www.w3id.org/iSeeOnto/BehaviourTree#pairKey"] = option.id;
            ops.push(op);
          });
          ask["http://www.w3id.org/iSeeOnto/userevaluation#hasResponseOptions"]["http://semanticscience.org/resource/SIO_000974"] = ops;

          evals.push(ask);
        });
        new_case["http://www.w3id.org/iSeeOnto/explanationexperience#hasOutcome"]["http://linkedu.eu/dedalo/explanationPattern.owl#isBasedOn"] =  evals; 
        all_cases.push(new_case);
      }));
    })).then(function(){
      res.json(all_cases);
    });

  } catch (error) {
    res.status(500).json({ message: error });
  }
};

module.exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;
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

module.exports.updateSettings = async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = { "settings": req.body.settings };
    const options = { new: true };

    const result = await Usecase.findByIdAndUpdate(id, updatedData, options);
    if (result) {
      res.send(result);
    } else {
      res.status(404).json({ message: "Usecase not found" });
    }
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: error.message })
  }
}

module.exports.updateModel = async (req, res) => {
  try {
    const id = req.params.id;
    const options = { new: true };

    let updatedData = {
      mode: req.body.mode,
      backend: req.body.backend,
      attributes: req.body.attributes,
      completed: req.body.completed,
      source_file: '',
      dataset_file: ''
    }

    let source_file = req.files.source_file;
    let dataset_file = req.files.dataset_file;

    const path_source = __dirname + "/tmp/" + source_file.name;
    const path_dataset = __dirname + "/tmp/" + dataset_file.name;

    await source_file.mv(path_source)
    await dataset_file.mv(path_dataset)
    const RAND = ''; // FOR DEV

    // Handle Model Upload
    var data_source = new FormData();
    const model_params = {
      "alias": id + RAND,
      "backend": 'sklearn',// FUTURE UPDATE
      "model_task": "classification", // FUTURE UPDATE
      "dataset_type": "Tabular", // FUTURE UPDATE
      "attributes": JSON.parse(updatedData.attributes)
    }
    data_source.append('id', id + RAND);
    data_source.append('info', JSON.stringify(model_params));
    data_source.append('file', fs.createReadStream(path_source));

    // console.log(data_source)
    let method = "POST";

    if (updatedData.completed == 'true') {
      console.log(updatedData.completed)
      method = "PUT";
    }

    var upload_source = {
      method: method,
      url: MODELAPI_URL + 'upload_model',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        ...data_source.getHeaders()
      },
      data: data_source
    };

    let response = await axios(upload_source)

    console.log(response.data)
    // Handle Dataset Upload
    var data_dataset = new FormData();
    data_dataset.append('id', id + RAND);
    data_dataset.append('file', fs.createReadStream(path_dataset));

    var upload_dataset = {
      method: 'post',
      url: MODELAPI_URL + 'dataset',
      headers: {
        ...data_dataset.getHeaders()
      },
      data: data_dataset
    };

    const responsedataset = await axios(upload_dataset);
    console.log(responsedataset.data)
    updatedData["dataset_file"] = responsedataset.data
    updatedData["source_file"] = response.data
    updatedData["completed"] = true; // FORCE COMPLETE AFTER UPLOAD TO PREVENT UPDATES

    const result = await Usecase.findByIdAndUpdate(id, { model: updatedData }, options);
    if (result) {
      fs.unlink(path_source, function () {
        console.log("File was deleted")
      });
      fs.unlink(path_dataset, function () {
        console.log("File was deleted")
      });
      res.send(updatedData);
    } else {
      res.status(404).json({ message: "Usecase not found" });
    }
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: error.message })
  }
}

module.exports.list = async (req, res) => {
  try {
    const data = await Usecase.find({ company: req.companyId });
    res.json(data)
  }
  catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Usecase.findByIdAndDelete(id);
    res.send(`Document with ${data.name} has been deleted..`);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports.updatePublish = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Usecase.findById(id)

    if (!data) {
      return res.status(404).send({ message: "Usecase Not found." });
    }

    data.published = req.body.status
    data.save()
    res.status(200).json({ message: "Usecase Published" })
  }
  catch (error) {
    res.status(400).json({ message: error.message })
  }
}

const Usecase = require("../models/usecase");
const Tree = require("../models/tree");
const axios = require('axios');
var FormData = require('form-data');
var fs = require('fs');
var Https = require('https');
const { v4 } = require("uuid");
const UsecaseInvite = require("../models/usecaseInvite");

const MODELAPI_URL = process.env.MODELAPI_URL;
const EXPLAINERAPI_URL = process.env.EXPLAINERAPI_URL;

module.exports.create = async (req, res) => {
  const data = new Usecase(req.body)
  try {
    data.company = req.companyId;
    data.user = req.userId;
    data.version = 0; // Start with 0 for unpublished state


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
  const cases = await computeCaseStructure(req.params.id)
  if (cases.length > 0) {
    res.json(cases)
  } else {
    res.status(500).json({ message: "Incomplete Usecase. Make sure to complete all the sections before generating the case structure!" });
  }
};


async function computeCaseStructure(usecaseId) {
  try {
    const data = await Usecase.findById(usecaseId);
    const response = await axios.get('https://raw.githubusercontent.com/isee4xai/iSeeCases/main/case-structure.json');
    const casestructure = response.data;
    var build_json = JSON.stringify(casestructure);

    const reponse_bases = await axios.get('https://raw.githubusercontent.com/isee4xai/iSeeCases/main/bases.json');
    const bases = reponse_bases.data;
    var base_list = [];
    for (k in bases) {
      var base = {
        "key": k,
        "val": bases[k]
      };
      base_list.push(base);
    }
    bases_keyed = []
    base_list.forEach(function (change) {
      build_json = build_json.replaceAll(change['key'], change['val'])
      bases_keyed[change['key']] = change['val'];
    });

    // need to remove spaces from the use case name
    build_json = build_json.replaceAll("<casename>", data["name"].replaceAll(" ", "_"));
    build_json = build_json.replaceAll("<version>", data["version"]);

    //basics updates
    var conv = [
      {
        "key": "<AITaskGoal>",
        "val": "goal",
        "sub": ""
      },
      {
        "key": "<Domain>",
        "val": "domain",
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
    build_json[bases_keyed["<ee_IRI>"] + "hasDescription"][bases_keyed["<ee_IRI>"] + "hasAIModel"][bases_keyed["<aimodel_IRI>"] + "solves"]["classes"] = [ai_tasks[ai_tasks.length - 1]];

    //AIMethod:list keeps a list of last items
    var ai_methods = data["settings"]["ai_method"];
    var methods = [];
    ai_methods.forEach(function (method) {
      methods.push(method[method.length - 1]);
    });
    build_json[bases_keyed['<ee_IRI>'] + "hasDescription"][bases_keyed['<ee_IRI>'] + "hasAIModel"][bases_keyed['<explainer_IRI>'] + "utilises"]["classes"] = methods;

    //AI Model assessments
    var aievals = data["settings"]["assessments"];
    let assessments = [];
    if (aievals) {
      aievals.forEach((option, i) => {
        let op = { ...build_json[bases_keyed['<ee_IRI>'] + "hasDescription"][bases_keyed['<ee_IRI>'] + "hasAIModel"][bases_keyed['<evaluation_IRI>'] + "annotatedBy"][0] };
        op["instance"] = op["instance"] + "_" + i;
        op["http://sensornet.abdn.ac.uk/onts/Qual-O#basedOn"] = option.assesment_type;
        temp = { ...op["http://www.w3.org/ns/prov#value"] };
        temp["value"] = option.assesment_val;
        op["http://www.w3.org/ns/prov#value"] = temp;
        assessments.push(op);
      });
    }

    build_json[bases_keyed['<ee_IRI>'] + "hasDescription"][bases_keyed['<ee_IRI>'] + "hasAIModel"][bases_keyed['<evaluation_IRI>'] + "annotatedBy"] = assessments;

    var all_cases = []
    // Now do persona by persona
    const all_mapping = await Promise.all(
      await data.personas.map(async function (persona) {
        await Promise.all(await persona.intents.map(async intent => {
          var new_case = JSON.stringify(build_json)

          new_case = new_case.replaceAll('<UserGroup>', persona.details.name);
          new_case = new_case.replaceAll('<Intent>', intent.name);
          new_case = new_case.replaceAll('<AIKnowledgeLevel>', persona.details.ai_knowledge_level);
          new_case = new_case.replaceAll('<DomainKnowledgeLevel>', persona.details.domain_knowledge_level);
          new_case = JSON.parse(new_case);

          const selected_tree = await Tree.findById(intent.strategy_selected);

          new_case[bases_keyed['<ee_IRI>'] + "hasSolution"] = selected_tree.data

          var asks = []
          intent.questions.forEach(question => {
            var ask = { ...new_case[bases_keyed['<ee_IRI>'] + "hasDescription"][bases_keyed['<ee_IRI>'] + "hasUserGroup"]["https://purl.org/heals/eo#asks"][0] };
            ask["http://semanticscience.org/resource/SIO_000300"] = question.text;
            ask["instance"] = ask["instance"] + "_" + question.id;
            if (question.target == "https://purl.org/heals/eo#SystemRecommendation") {
              ask[bases_keyed['<user_IRI>'] + "hasQuestionTarget"] = new_case[bases_keyed['<ee_IRI>'] + "hasDescription"][bases_keyed['<ee_IRI>'] + "hasAIModel"][bases_keyed['<aimodel_IRI>'] + "solves"]["http://semanticscience.org/resource/SIO_000229"][0];
            }
            else if (question.target == "https://purl.org/heals/eo#ArtificialIntelligenceMethod") {
              ask[bases_keyed['<user_IRI>'] + "hasQuestionTarget"] = new_case[bases_keyed['<ee_IRI>'] + "hasDescription"][bases_keyed['<ee_IRI>'] + "hasAIModel"][bases_keyed['<explainer_IRI>'] + "utilises"];
            }
            else if (question.target == bases_keyed['<aimodel_IRI>'] + "Dataset") {
              ask[bases_keyed['<user_IRI>'] + "hasQuestionTarget"] = new_case[bases_keyed['<ee_IRI>'] + "hasDescription"][bases_keyed['<ee_IRI>'] + "hasAIModel"][bases_keyed['<aimodel_IRI>'] + "trainedOn"][0];
            }
            asks.push(ask);
          });

          // Added Unique ID for User Group
          new_case[bases_keyed['<ee_IRI>'] + "hasDescription"][bases_keyed['<ee_IRI>'] + "hasUserGroup"]["instance"] = "http://www.w3id.org/iSeeOnto/explanationexperience/with_model/with_modelUserGroup_" + persona._id;

          new_case[bases_keyed['<ee_IRI>'] + "hasDescription"][bases_keyed['<ee_IRI>'] + "hasAIModel"][bases_keyed['<aimodel_IRI>'] + "hasCaseStructureMetaData"]["value"] = JSON.stringify(data.model.attributes)

          new_case[bases_keyed['<ee_IRI>'] + "hasDescription"][bases_keyed['<ee_IRI>'] + "hasUserGroup"]["https://purl.org/heals/eo#asks"] = asks;

          var evals = []
          var index = 0;
          const evalQTemplate = JSON.stringify(new_case[bases_keyed['<ee_IRI>'] + "hasOutcome"]["http://linkedu.eu/dedalo/explanationPattern.owl#isBasedOn"][0])

          const evalResponsesTemplate = JSON.stringify(new_case[bases_keyed['<ee_IRI>'] + "hasOutcome"]["http://linkedu.eu/dedalo/explanationPattern.owl#isBasedOn"][0][bases_keyed['<ue_IRI>'] + "hasResponseOptions"]["http://semanticscience.org/resource/SIO_000974"][0]);

          intent.evaluation.questions.forEach(question => {
            var evalAsk = JSON.parse(evalQTemplate)

            evalAsk["http://www.w3.org/2000/01/rdf-schema#comment"] = question.content;
            evalAsk["instance"] = evalAsk["instance"] + "_" + question.id;
            evalAsk[bases_keyed['<ue_IRI>'] + "sequenceIndex"] = index++;

            switch (question.responseType) {
              case "Free-Text":
                evalAsk["classes"] = [bases_keyed['<ue_IRI>'] + "Open_Question"];
                break;
              case "Number":
                evalAsk["classes"] = [bases_keyed['<ue_IRI>'] + "Number_Question"];
                break;
              case "Radio":
                evalAsk["classes"] = [bases_keyed['<ue_IRI>'] + "SingleChoiceNominalQuestion"];
                break;
              case "Likert":
                evalAsk["classes"] = [bases_keyed['<ue_IRI>'] + "Likert_Scale_Question"];
                break;
              case "Checkbox":
                evalAsk["classes"] = [bases_keyed['<ue_IRI>'] + "MultipleChoiceNominalQuestion"];
                break;
              default:
                evalAsk["classes"] = [bases_keyed['<ue_IRI>'] + "Likert_Scale_Question"];
            }

            evalAsk["http://sensornet.abdn.ac.uk/onts/Qual-O#measures"]["instance"] = question.dimension;

            if (question.responseType == "Checkbox" || question.responseType == "Likert" || question.responseType == "Radio") {
              let ops = [];
              question.responseOptions.forEach(option => {
                let op = JSON.parse(evalResponsesTemplate);
                op["instance"] = op["instance"] + "_" + option.id;
                op["https://www.w3id.org/iSeeOnto/BehaviourTree#pair_value_literal"] = option.content;
                op["https://www.w3id.org/iSeeOnto/BehaviourTree#pairKey"] = option.id;
                ops.push(op);
              });

              evalAsk["http://www.w3id.org/iSeeOnto/userevaluation#hasResponseOptions"]["http://semanticscience.org/resource/SIO_000974"] = ops;
            } else {
              evalAsk[bases_keyed['<ue_IRI>'] + "hasResponseOptions"] = {}
            }

            if (question.responseType == "Number" && question.validators) {
              var new_evalAsk = JSON.stringify(evalAsk)
              new_evalAsk = new_evalAsk.replaceAll('<max_value>', question.validators.max);
              new_evalAsk = new_evalAsk.replaceAll('<min_value>', question.validators.min);
              evalAsk = JSON.parse(new_evalAsk);
            }
            else {
              evalAsk[bases_keyed['<ue_IRI>'] + "hasAnswerFrom"] = []
            }

            evals.push(evalAsk);
          });
          new_case[bases_keyed['<ee_IRI>'] + "hasOutcome"]["http://linkedu.eu/dedalo/explanationPattern.owl#isBasedOn"] = evals;
          all_cases.push(new_case);
        }));
      }))

    return all_cases;

  } catch (error) {
    console.log(error)
    return false;
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

    const usecase = await Usecase.findById(req.params.id);

    let updatedData = {
      mode: req.body.mode,
      backend: req.body.backend,
      attributes: JSON.parse(req.body.attributes),
      completed: usecase.model.completed,
      source_file: '',
      dataset_file: ''
    }

    let source_file = req.files.source_file;
    let dataset_file = req.files.dataset_file;

    const path_source = __dirname + "/tmp/" + source_file.name;
    const path_dataset = __dirname + "/tmp/" + dataset_file.name;

    await source_file.mv(path_source)
    await dataset_file.mv(path_dataset)

    // FUTURE IMPROVEMENTS: Parse iSee Data to ML Lib Format
    let ai_task = usecase.settings.ai_task[usecase.settings.ai_task.length - 1];
    let dataset_type = usecase.settings.dataset_type;
    let backend = req.body.backend;

    // console.log(JSON.stringify(convert_attributes(updatedData.attributes)))
    // return false;

    // Handle Model Upload
    var data_source = new FormData();
    const model_params = {
      "alias": id,
      "backend": backend,
      "model_task": ai_task,
      "dataset_type": dataset_type,
      "attributes": convert_attributes(updatedData.attributes)
    }

    console.log("------- model_params ------")
    console.log(model_params)

    data_source.append('id', id);
    data_source.append('info', JSON.stringify(model_params));
    data_source.append('file', fs.createReadStream(path_source));


    let method = "POST";

    if (updatedData.completed) {
      method = "PUT";
    }

    var upload_source = {
      method: method,
      url: MODELAPI_URL + 'upload_model',
      'maxContentLength': Infinity,
      'maxBodyLength': Infinity,
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
    data_dataset.append('id', id);
    data_dataset.append('file', fs.createReadStream(path_dataset));

    var upload_dataset = {
      method: 'post',
      url: MODELAPI_URL + 'dataset',
      'maxContentLength': Infinity,
      'maxBodyLength': Infinity,
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

// Build the object to support the iSee Model Hub API Spec
function convert_attributes(attr) {
  let attributes = { target_names: [], features: {} }

  attr.forEach(function (a) {
    let feature = { data_type: a.datatype }

    // Push if a target feature
    if (a.target) {
      attributes.target_names.push(a.name);
    }

    if (a.datatype == "numerical") {
      feature.min = parseFloat(a.min)
      feature.max = parseFloat(a.max)
      feature.min_raw = parseFloat(a.min_raw)
      feature.max_raw = parseFloat(a.max_raw)
    }

    if (a.datatype == "image") {
      if (a.name == "image_zip") {
        feature.mean_raw = parseFloat(a.mean_raw)
        feature.std_raw = parseFloat(a.std_raw)
      }
      // Shape Conversion
      feature.shape = a.shape.split(/,/).map(parseFloat)
      feature.shape_raw = a.shape_raw.split(/,/).map(parseFloat)

      feature.min = parseFloat(a.min)
      feature.max = parseFloat(a.max)
      feature.min_raw = parseFloat(a.min_raw)
      feature.max_raw = parseFloat(a.max_raw)
    }

    if (a.datatype == "categorical") {
      let cat_values = []
      let cat_values_raw = []

      a.values.forEach(function (val) {
        cat_values.push(parseFloat(val.value))
        cat_values_raw.push(val.raw)
      })

      feature.values = cat_values
      feature.values_raw = cat_values_raw
    }

    if (a.datatype == "image") {
      attributes.features["image"] = feature
    } else {
      attributes.features[a.name] = feature
    }
  })
  return attributes;
}

module.exports.list = async (req, res) => {
  try {
    const data = await Usecase.find({ company: req.companyId },["_id", "name", "published", "goal","invites", "interactions", "endusers", "version", "createdAt"]);
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

////////////////////////////////////////////////////////////
// Manage Endusers 
////////////////////////////////////////////////////////////
module.exports.createInvite = async (req, res) => {
  let data = new UsecaseInvite();

  try {
    data.name = req.body.name;
    data.company = req.companyId;
    data.user = req.userId;
    data.published = true;
    data.key = v4();
    data.usecase = req.params.id;

    const usecase = await Usecase.findById(req.params.id)

    const invite = await data.save();
    usecase.invites.push(invite);
    usecase.save()

    res.status(200).json(invite)
  }
  catch (error) {
    res.status(400).json({ message: error.message })
  }
}

module.exports.getInvites = async (req, res) => {
  try {
    const data = await UsecaseInvite.find({ usecase: req.params.id }).populate('endusers').sort({ createdAt: "desc" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

module.exports.updateInvitePublish = async (req, res) => {
  try {
    const id = req.params.id;
    const inviteId = req.params.inviteId;
    const data = await UsecaseInvite.findById(inviteId)

    if (!data) {
      return res.status(404).send({ message: "Usecase Invite Not found." });
    }

    data.published = req.body.status
    data.save()
    res.status(200).json({ message: "Usecase Invite Updated" })
  }
  catch (error) {
    res.status(400).json({ message: error.message })
  }
}

module.exports.validateInviteCode = async (req, res) => {
  try {
    const data = await UsecaseInvite.findOne({ key: req.params.id, published: true });
    if (data) {
      res.json({ name: data.name });
    } else {
      res.status(404).json({ message: "Invalid Invite Code" });
    }
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

/////////////////////////////////////////////////////////////////////////
// Model Hub Integration
/////////////////////////////////////////////////////////////////////////
module.exports.getRandomDataInstance = async (req, res) => {
  try {

    var config = {
      method: 'GET',
      url: MODELAPI_URL + 'num_instances/' + req.params.id,
      headers: {}
    };

    let response = await axios(config)
    const num_instances = response.data.count;
    const rand_index = generateRandom(num_instances);

    var config = {
      method: 'GET',
      url: MODELAPI_URL + 'instance/' + req.params.id + '/' + rand_index,
      headers: {}
    };

    let response_sample = await axios(config)

    res.json(response_sample.data);
  } catch (error) {
    res.status(500).json({ message: error });
  }
}

module.exports.getDatasetCount = async (req, res) => {
  try {

    var config = {
      method: 'GET',
      url: MODELAPI_URL + 'num_instances/' + req.params.id,
      headers: {}
    };

    let response = await axios(config)
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: error });
  }
}

module.exports.getModelPredictResponse = async (req, res) => {
  try {

    const instance = req.body.instance;
    const type = req.body.type;
    const top_classes = req.body.top_classes;
    console.log("getModelPredictResponse - " + req.params.id);

    var config = {
      method: 'post',
      url: MODELAPI_URL + 'predict',
      headers: {
        'Content-Type': 'application/json'
      },
      maxBodyLength: Infinity,
      data: {
        type: type,
        id: req.params.id,
        top_classes: top_classes,
        instance: instance
      }
    };

    const response_predict = await axios(config);
    let output = response_predict.data;
    res.json(output);
  } catch (error) {
    res.status(500).json({ message: error });
  }
}

module.exports.getExplainerResponse = async (req, res) => {
  try {

    const instance_body = req.body.instance;
    const explainer_method = req.body.method;
    const params = req.body.params;
    const type = req.body.type;
    console.log("getExplainerResponse - " + explainer_method);

    // TODO: Check if everything needs to be sent
    const cases = await computeCaseStructure(req.params.id)

    var config = {
      method: 'post',
      url: EXPLAINERAPI_URL + explainer_method,
      headers: {
        'Content-Type': 'application/json'
      },
      maxBodyLength: Infinity,
      data: {
        type: type,
        id: req.params.id,
        instance: instance_body,
        usecase: cases,
        params: params
      }
    };

    const response_predict = await axios(config);
    console.log(response_predict.data);

    let output = response_predict.data;
    const meta = await axios.get(EXPLAINERAPI_URL + '/' + explainer_method)
    output.meta = meta.data
    console.log(output)
    res.json(output);
  } catch (error) {
    res.status(500).json({ message: error });
  }
}

module.exports.getExplainerResponseOld = async (req, res) => {
  try {

    // FOR IMAGE DATA
    // Download image as Temporary file and append to predict API
    const temp_download = __dirname + '/tmp/' + v4() + ".png";
    console.log("Explainer Predict API")
    console.log(req.body)

    const instance_url = req.body.instance;
    await downloadFile(instance_url, temp_download);

    // Handle Instance Predict
    var req_dataset = new FormData();
    req_dataset.append('id', req.params.id);
    req_dataset.append('image', fs.createReadStream(temp_download));
    if (req.body.params) {
      data.append('params', JSON.stringify(req.body.params));
    }

    const explainer_method = req.body.method

    var config = {
      method: 'post',
      url: EXPLAINERAPI_URL + explainer_method,
      headers: {
        ...req_dataset.getHeaders()
      },
      data: req_dataset
    };

    const response_predict = await axios(config);
    console.log(response_predict.data);

    fs.unlink(temp_download, function () {
      console.log("temp_download File was deleted")
    });

    let output = response_predict.data;
    const meta = await axios.get(EXPLAINERAPI_URL + '/' + explainer_method)
    output.meta = meta.data
    console.log(output)
    res.json(output);
  } catch (error) {
    res.status(500).json({ message: error });
  }
}

module.exports.getModelPredictResponseOld = async (req, res) => {
  try {
    const usecase = await Usecase.findById(req.params.id)

    // FOR IMAGE DATA
    // Download image as Temporary file and append to predict API
    const temp_download = __dirname + '/tmp/' + v4() + ".png";
    console.log("Mode Predict API")
    console.log(req.body)
    console.log(req.body.instance)

    const instance_url = req.body.instance;
    await downloadFile(instance_url, temp_download);

    // Handle Instance Predict
    var req_dataset = new FormData();
    req_dataset.append('id', req.params.id);
    req_dataset.append('top_classes', req.body.top_classes);
    req_dataset.append('image', fs.createReadStream(temp_download));

    var config = {
      method: 'post',
      url: MODELAPI_URL + 'predict',
      headers: {
        ...req_dataset.getHeaders()
      },
      data: req_dataset
    };

    const response_predict = await axios(config);
    console.log(response_predict.data);

    fs.unlink(temp_download, function () {
      console.log("temp_download File was deleted")
    });

    // const model_attributes = JSON.parse(usecase.model.attributes)
    // let output = response.data.predictions[0];
    // let target_values = model_attributes.target_values[0]

    // let d = {}
    // for (var i = 0; i < target_values.length; i++){
    //   d[target_values[i]] = output[i];
    // }
    res.json(response_predict.data);
  } catch (error) {
    res.status(500).json({ message: error });
  }
}

function generateRandom(maxLimit = 100) {
  let rand = Math.random() * maxLimit;
  rand = Math.floor(rand);
  return rand;
}

async function downloadFile(url, targetFile) {
  return await new Promise((resolve, reject) => {
    Https.get(url, response => {
      const code = response.statusCode ?? 0
      if (code >= 400) {
        return reject(new Error(response.statusMessage))
      }
      if (code > 300 && code < 400 && !!response.headers.location) {
        return resolve(
          downloadFile(response.headers.location, targetFile)
        )
      }
      const fileWriter = fs
        .createWriteStream(targetFile)
        .on('finish', () => {
          resolve({})
        })
      response.pipe(fileWriter)
    }).on('error', error => {
      reject(error)
    })
  })
}

/////////////////////////////////////////////////////////////////////////

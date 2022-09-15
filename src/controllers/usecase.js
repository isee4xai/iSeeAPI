const Usecase = require("../models/usecase");
const axios = require('axios');

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

    const response = await axios.get('https://raw.githubusercontent.com/isee4xai/iSeeCases/case-structure-v2/case-structure-extended.json')
    const casestructure = response.data;
    var build_json = JSON.stringify(casestructure);

    var conv = [
      {
        "key": "<casename>",
        "val": "name",
        "sub": ""
      },
      {
        "key": "<Description>",
        "val": "goal",
        "sub": ""
      },
      {
        "key": "<AITask>",
        "val": "ai_task",
        "sub": "settings"
      },
      {
        "key": "<AIMethod>",
        "val": "ai_method",
        "sub": "settings"
      },
      {
        "key": "<NumberOfFeatures>",
        "val": "num_features",
        "sub": "settings"
      },
      {
        "key": "<NumberOfInstances>",
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

    build_json = build_json.replaceAll('<Portability>', 'model-specific')
    build_json = build_json.replaceAll('<Concurrentness>', 'post-hoc')
    build_json = build_json.replaceAll('<Presentation>', 'media')
    build_json = build_json.replaceAll('<ExplanationScope>', 'local')
    build_json = build_json.replaceAll('<ExplanationTarget>', 'prediction')

    build_json = JSON.parse(build_json);

    // assessments
    var localasse  = []
    data.settings.assessments.forEach(function(a){
      var single = {
        "instance": data.name+""+a.assesment_type,
        "basedOn": a.assesment_type,
        "comment": a.assesment_val,
        "measures": "Performance",
        "classes": [
          "AIModelAssessmentResult"
        ]
      }
      localasse.push(single)
    })
    build_json["hasDescription"]["annotatedBy"] =  localasse

    var all_cases = []

    // Now do persona by persona
    data.personas.forEach(function(persona){
      // console.log(persona)
      persona.intents.forEach(intent => {
        var new_case = JSON.stringify(build_json)
        new_case = new_case.replaceAll('<Intent>', intent.name);
        new_case = new_case.replaceAll('<Technical Facilities>', "ScreenDisplay");

        // console.log(persona.details.ai_level)
        new_case = new_case.replaceAll('<AIKnowledgeLevel>', persona.details.ai_level);
        new_case = new_case.replaceAll('<DomainKnowledgeLevel>', persona.details.domain_level);
        new_case = new_case.replaceAll('<UserQuestion>', intent.questions);
        new_case = new_case.replaceAll('<UserQuestionTarget>', intent.name);
        
        all_cases.push(JSON.parse(new_case))
      });

    })
    
    res.json(all_cases);
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

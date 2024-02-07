const Tree = require("../models/tree");
const axios = require('axios');
const Usecase = require("../models/usecase");
const CBRAPI_URL = process.env.CBRAPI_URL;
const ONTOAPI_URL = process.env.ONTOAPI_URL;
const CBRAPI_TOKEN = process.env.CBRAPI_TOKEN;


module.exports.create = async (req, res) => {
  const data = new Tree(req.body)
  try {
    const dataToSave = await data.save();
    res.status(200).json(dataToSave)
  }
  catch (error) {
    res.status(400).json({ message: error.message })
  }
}

module.exports.list = async (req, res) => {
  try {
    const path = req.query.path
    console.log(path)
    if (path) {
      const data = await Tree.find({ path: path });
      res.json(data)
    } else {
      const data = await Tree.find({});
      res.json(data)
    }

  }
  catch (error) {
    res.status(500).json({ message: error.message })
  }
}


module.exports.get = async (req, res) => {
  try {
    const data = await Tree.findById(req.params.id);
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ message: "not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error });
  }
};


module.exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;
    const options = { new: true };

    const result = await Tree.findByIdAndUpdate(
      id, updatedData, options
    )
    if (result) {
      res.send(result)
    } else {
      res.status(404).json({ message: "Tree not found" })
    }
  }
  catch (error) {
    res.status(400).json({ message: error.message })
  }
}


module.exports.methods = async (req, res) => {
  try {
    const requestData = req.body;
    const usecase = await Usecase.findById(requestData.usecaseId);
    const reuse_support_props = await axios.get(ONTOAPI_URL + 'reuse/ReuseSupport');
    if (!usecase) {
        return { message: "Use case not found! Check the usecase ID" };
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
    const appResponse = await axios(config);
    console.log("applicabilities", appResponse.data);
    const data = await Tree.findById(requestData.treeId);
    if (data) {
      let methods = []
      let apps = {}
      data.data.trees.forEach(t => {
        for (var n in t.nodes) {
          if (t.nodes[n].Concept == "Explanation Method") {
            methods.push(t.nodes[n].Instance);
            apps[t.nodes[n].Instance] = appResponse.data[t.nodes[n].Instance];
          }
        }
      });
      console.log("methods", methods);
      console.log("apps", apps);
      res.status(200).json({"methods": methods, "applicabilities":applicabilities});
    } else {
      res.status(404).json({ message: "not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error });
  }
};




// module.exports.delete = async (req, res) => {
//   try {
//     const id = req.params.id;
//     const data = await Usecase.findByIdAndDelete(id);
//     res.send(`Document with ${data.name} has been deleted..`);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };
const Tree = require("../models/tree");
const axios = require('axios');

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
    const data = await Tree.findById(req.params.id);
    if (data) {
      let methods = []
      data.trees.forEach(t => {
        for (var n in t.nodes) {
          if (t.nodes[n].Concept == "Explanation Method") {
            methods.push(t.nodes[n].Instance)
          }
        }
      });
      res.json(methods);
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
const Interaction = require("../models/interaction");
const { v4: uuidv4 } = require("uuid");

module.exports.create = async (req, res) => {
  console.log("Interaction Create --")
  let data = new Interaction({ ...req.body });
  data.company = req.companyId;
  data.user = req.userId;
  data.usecase = req.params.id;
  
  console.log("Interaction req.params.id --", req.params.id)

  try {
    const result = await data.save();
    console.log("Interaction data.save --")

    res.status(200).json({"status": true});
  } catch (error) {
    console.log("Interaction error --", error)

    res
      .status(400)
      .send({
        message:
          error.message ||
          "Some error occurred while creating the interaction.",
      });
  }
};

module.exports.findAll = async (req, res) => {
    try {
      const data = await Interaction.find();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

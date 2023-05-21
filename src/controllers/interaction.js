const Interaction = require("../models/interaction");
const { v4: uuidv4 } = require("uuid");
const Usecase = require("../models/usecase");

module.exports.create = async (req, res) => {
  console.log("Interaction Create --")
  let interaction = new Interaction({ ...req.body });
  interaction.company = req.companyId;
  interaction.user = req.userId;
  interaction.usecase = req.params.id;
  
  console.log("Interaction req.params.id --", req.params.id)

  try {
    const result = await interaction.save();
    console.log("Interaction interaction.save --")

    // Reference Document
    const usecase = await Usecase.findById(req.params.id)
    usecase.interactions.push(interaction);
    usecase.save()

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
      const interaction = await Interaction.find();
      res.json(interaction);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

const interaction = require("../models/interaction");
const { v4: uuidv4 } = require("uuid");

module.exports.create = async (req, res) => {
  const data = new interaction({ ...req.body });
  try {
    const result = await data.save();
    res.status(200).json(result);
  } catch (error) {
    res
      .status(400)
      .send({
        message:
          error.message ||
          "Some error occurred while creating the questionnaire.",
      });
  }
};

module.exports.findAll = async (req, res) => {
    try {
      const data = await interaction.find();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

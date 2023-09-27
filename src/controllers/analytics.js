const Interaction = require("../models/interaction");
const analyticsUtil = require("./analytics-util")

module.exports.getAnalytics = async (req, res) => {
  try {
    const contents = await Interaction.find({ usecase: req.params.id, usecase_version: req.query.version }, ['user', 'createdAt', 'usecase_version', 'interaction']).populate('user').populate('interaction').sort({ createdAt: "desc" });
    const analytics = analyticsUtil.analytics(contents);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
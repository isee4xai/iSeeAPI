const Interaction = require("../models/interaction");
const analyticsUtil = require("./analytics-util")

module.exports.getAnalytics = async (req, res) => {
  try {
    const contents = await Interaction.find({ usecase: req.params.id, usecase_version: req.query.version }, ['user', 'createdAt', 'usecase_version', 'interaction']).populate('user').populate('interaction').sort({ createdAt: "desc" });
    console.log("contents.length", contents.length);
    const analytics = analyticsUtil.analytics(contents);
    console.log("analytics.keys", Object.keys(analytics));
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
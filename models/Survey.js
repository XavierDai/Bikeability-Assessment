const mongoose = require('mongoose');

const SurveySchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  surveyData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Survey', SurveySchema);
const mongoose = require('mongoose');

const SurveySchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  surveyData: {
    // Basic demographics
    q2: String, // Gender
    q2_other: String, // Gender other specification
    q3: String, // Age
    q5: [String], // Race/ethnicity (multiple selection)
    q5_other: String, // Race/ethnicity other specification
    q6: String, // Education level
    
    // Infrastructure comfort ratings (1-5 scale)
    shoulder_comfort: String, // Roadway shoulder comfort
    striped_comfort: String, // Striped bike lane comfort
    buffered_comfort: String, // Buffered bike lane comfort
    protected_comfort: String, // Protected bike lane comfort
    multiuse_comfort: String, // Off-street multi-use path comfort
    shared_comfort: String, // Shared lanes comfort
    sidewalk_comfort: String, // Sidewalk comfort
    nobike_comfort: String // Streets with no bike lanes comfort
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
SurveySchema.index({ sessionId: 1 });
SurveySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Survey', SurveySchema);
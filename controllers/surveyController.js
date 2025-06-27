const Survey = require('../models/Survey');

// Submit survey
exports.submitSurvey = async (req, res) => {
  try {
    const { sessionId, surveyData } = req.body;
    
    if (!sessionId || !surveyData) {
      return res.status(400).json({
        success: false,
        error: 'Missing session ID or survey data'
      });
    }
    
    // Check if survey already exists for this session
    const existingSurvey = await Survey.findOne({ sessionId });
    
    if (existingSurvey) {
      return res.status(400).json({
        success: false,
        error: 'Survey already submitted for this session'
      });
    }
    
    const survey = await Survey.create({
      sessionId,
      surveyData
    });
    
    return res.status(201).json({
      success: true,
      data: survey
    });
  } catch (err) {
    console.error('Survey submission error:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get survey by session ID
exports.getSurvey = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const survey = await Survey.findOne({ sessionId });
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found for this session'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: survey
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};
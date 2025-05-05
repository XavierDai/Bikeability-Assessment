const Survey = require('../models/Survey');

// @desc    提交问卷
// @route   POST /api/surveys
exports.submitSurvey = async (req, res) => {
  try {
    const { sessionId, surveyData } = req.body;
    
    if (!sessionId || !surveyData) {
      return res.status(400).json({
        success: false,
        error: '缺少会话ID或问卷数据'
      });
    }
    
    // 检查是否已存在相同sessionId的记录
    const existingSurvey = await Survey.findOne({ sessionId });
    
    if (existingSurvey) {
      return res.status(400).json({
        success: false,
        error: '该会话已提交过问卷'
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
    console.error('提交问卷错误:', err);
    return res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
};

// @desc    获取问卷信息
// @route   GET /api/surveys/:sessionId
exports.getSurvey = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const survey = await Survey.findOne({ sessionId });
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: '未找到该会话的问卷数据'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: survey
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
};
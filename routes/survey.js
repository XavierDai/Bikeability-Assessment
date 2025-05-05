const express = require('express');
const router = express.Router();
const { 
  submitSurvey,
  getSurvey
} = require('../controllers/surveyController');

// 提交问卷
router.post('/', submitSurvey);

// 获取问卷
router.get('/:sessionId', getSurvey);

module.exports = router;
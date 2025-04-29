const express = require('express');
const router = express.Router();
const { 
  getRatings, 
  getRatingsByLocation,
  addRating,
  getRatingStats
} = require('../controllers/ratingController');

// 获取所有评分
router.get('/', getRatings);

// 根据位置获取评分
router.get('/location/:lat/:lng', getRatingsByLocation);
router.get('/location/:lat/:lng/:radius', getRatingsByLocation);

// 获取评分统计数据
router.get('/stats', getRatingStats);

// 添加评分
router.post('/', addRating);

module.exports = router;
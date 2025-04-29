const Rating = require('../models/Rating');

// @desc    获取所有评分
// @route   GET /api/ratings
exports.getRatings = async (req, res) => {
  try {
    const ratings = await Rating.find();
    
    return res.status(200).json({
      success: true,
      count: ratings.length,
      data: ratings
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
};

// @desc    根据位置获取评分
// @route   GET /api/ratings/location/:lat/:lng/:radius
exports.getRatingsByLocation = async (req, res) => {
  try {
    const { lat, lng, radius = 0.005 } = req.params; // 默认半径约500米
    
    // 查找指定坐标附近的评分
    const ratings = await Rating.find({
      'location.lat': { $gte: parseFloat(lat) - radius, $lte: parseFloat(lat) + radius },
      'location.lng': { $gte: parseFloat(lng) - radius, $lte: parseFloat(lng) + radius }
    });
    
    return res.status(200).json({
      success: true,
      count: ratings.length,
      data: ratings
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
};

// @desc    添加评分
// @route   POST /api/ratings
exports.addRating = async (req, res) => {
  try {
    const rating = await Rating.create(req.body);
    
    return res.status(201).json({
      success: true,
      data: rating
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      return res.status(500).json({
        success: false,
        error: '服务器错误'
      });
    }
  }
};

// @desc    获取统计数据
// @route   GET /api/ratings/stats
exports.getRatingStats = async (req, res) => {
  try {
    // 获取每个类别的平均评分
    const stats = await Rating.aggregate([
      {
        $group: {
          _id: null,
          avgBikelanes: { $avg: '$ratings.bikelanes' },
          avgSafety: { $avg: '$ratings.safety' },
          avgSurface: { $avg: '$ratings.surface' },
          avgTraffic: { $avg: '$ratings.traffic' },
          avgConnectivity: { $avg: '$ratings.connectivity' },
          avgTotal: { $avg: '$ratings.total' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    return res.status(200).json({
      success: true,
      data: stats[0] || {
        avgBikelanes: 0,
        avgSafety: 0,
        avgSurface: 0,
        avgTraffic: 0,
        avgConnectivity: 0,
        avgTotal: 0,
        count: 0
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
};
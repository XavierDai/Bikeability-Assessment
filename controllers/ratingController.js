const Rating = require('../models/Rating');

// @desc    获取所有评分
// @route   GET /api/ratings
exports.getRatings = async (req, res) => {
  try {
    // 分页
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // 查询评分
    const ratings = await Rating.find()
      .sort({ createdAt: -1 }) // 按时间倒序
      .skip(skip)
      .limit(limit);
    
    // 获取总数
    const total = await Rating.countDocuments();
    
    return res.status(200).json({
      success: true,
      count: ratings.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: ratings
    });
  } catch (err) {
    console.error('获取评分列表错误:', err);
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
    
    // 将radius转换为数字
    const radiusNum = parseFloat(radius);
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    // 查找指定坐标附近的评分
    const ratings = await Rating.find({
      'location.lat': { 
        $gte: latitude - radiusNum, 
        $lte: latitude + radiusNum 
      },
      'location.lng': { 
        $gte: longitude - radiusNum, 
        $lte: longitude + radiusNum 
      }
    }).sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: ratings.length,
      data: ratings
    });
  } catch (err) {
    console.error('区域评分查询错误:', err);
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
    // 验证必要字段
    if (!req.body.ratings || 
        typeof req.body.ratings.safety === 'undefined' || 
        typeof req.body.ratings.comfort === 'undefined' || 
        typeof req.body.ratings.total === 'undefined') {
      return res.status(400).json({
        success: false,
        error: '缺少必要的评分数据 (safety, comfort, total)'
      });
    }
    
    // 验证评分范围 (1-10)
    const { safety, comfort, total } = req.body.ratings;
    if (safety < 1 || safety > 10 || comfort < 1 || comfort > 10 || total < 1 || total > 10) {
      return res.status(400).json({
        success: false,
        error: '评分必须在1-10之间'
      });
    }
    
    // 添加用户信息
    const ratingData = {
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };
    
    // 创建评分
    const rating = await Rating.create(ratingData);
    
    return res.status(201).json({
      success: true,
      message: '评分提交成功',
      data: rating
    });
  } catch (err) {
    console.error('评分提交错误:', err);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
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
    // 计算总体统计
    const totalRatings = await Rating.countDocuments();
    
    // 计算平均评分
    const avgStats = await Rating.aggregate([
      {
        $group: {
          _id: null,
          avgSafety: { $avg: '$ratings.safety' },
          avgComfort: { $avg: '$ratings.comfort' },
          avgTotal: { $avg: '$ratings.total' },
          // 保留旧字段的统计以兼容
          avgBikelanes: { $avg: '$ratings.bikelanes' },
          avgSurface: { $avg: '$ratings.surface' },
          avgTraffic: { $avg: '$ratings.traffic' },
          avgConnectivity: { $avg: '$ratings.connectivity' }
        }
      }
    ]);
    
    // 评分分布统计
    const ratingDistribution = await Rating.aggregate([
      {
        $bucket: {
          groupBy: '$ratings.total',
          boundaries: [1, 3, 5, 7, 9, 11],
          default: 'other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);
    
    // 最近评分趋势（按天统计）
    const recentTrends = await Rating.aggregate([
      {
        $match: {
          createdAt: { 
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 最近30天
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: "$createdAt" 
            }
          },
          count: { $sum: 1 },
          avgTotal: { $avg: '$ratings.total' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    const defaultStats = {
      avgSafety: 0,
      avgComfort: 0,
      avgTotal: 0,
      avgBikelanes: 0,
      avgSurface: 0,
      avgTraffic: 0,
      avgConnectivity: 0
    };
    
    const averageRatings = avgStats.length > 0 ? {
      safety: parseFloat((avgStats[0].avgSafety || 0).toFixed(1)),
      comfort: parseFloat((avgStats[0].avgComfort || 0).toFixed(1)),
      total: parseFloat((avgStats[0].avgTotal || 0).toFixed(1)),
      // 保留旧字段以兼容
      bikelanes: parseFloat((avgStats[0].avgBikelanes || 0).toFixed(1)),
      surface: parseFloat((avgStats[0].avgSurface || 0).toFixed(1)),
      traffic: parseFloat((avgStats[0].avgTraffic || 0).toFixed(1)),
      connectivity: parseFloat((avgStats[0].avgConnectivity || 0).toFixed(1))
    } : defaultStats;
    
    return res.status(200).json({
      success: true,
      data: {
        totalRatings,
        averageRatings,
        ratingDistribution,
        recentTrends
      }
    });
  } catch (err) {
    console.error('统计查询错误:', err);
    return res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
};

// @desc    根据道路ID获取评分
// @route   GET /api/ratings/road/:roadId
exports.getRatingsByRoad = async (req, res) => {
  try {
    const { roadId } = req.params;
    
    // 查询特定道路的评分
    const ratings = await Rating.find({ 'road.id': roadId })
      .sort({ createdAt: -1 });
    
    // 计算平均分
    let avgRatings = {
      safety: 0,
      comfort: 0,
      total: 0
    };
    
    if (ratings.length > 0) {
      ratings.forEach(rating => {
        avgRatings.safety += rating.ratings.safety;
        avgRatings.comfort += rating.ratings.comfort;
        avgRatings.total += rating.ratings.total;
      });
      
      // 计算平均值
      Object.keys(avgRatings).forEach(key => {
        avgRatings[key] = parseFloat((avgRatings[key] / ratings.length).toFixed(1));
      });
    }
    
    return res.status(200).json({
      success: true,
      count: ratings.length,
      averageRatings: avgRatings,
      data: ratings
    });
  } catch (err) {
    console.error('道路评分查询错误:', err);
    return res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
};
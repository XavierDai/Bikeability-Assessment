const Rating = require('../models/Rating');

// Get all ratings with pagination
exports.getRatings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const ratings = await Rating.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
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
    console.error('Get ratings error:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get ratings by location
exports.getRatingsByLocation = async (req, res) => {
  try {
    const { lat, lng, radius = 0.005 } = req.params;
    
    const radiusNum = parseFloat(radius);
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    const ratings = await Rating.find({
      $expr: {
        $and: [
          { $gte: [{ $toDouble: "$location.lat" }, latitude - radiusNum] },
          { $lte: [{ $toDouble: "$location.lat" }, latitude + radiusNum] },
          { $gte: [{ $toDouble: "$location.lng" }, longitude - radiusNum] },
          { $lte: [{ $toDouble: "$location.lng" }, longitude + radiusNum] }
        ]
      }
    }).sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: ratings.length,
      data: ratings
    });
  } catch (err) {
    console.error('Location ratings query error:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Add new rating
exports.addRating = async (req, res) => {
  try {
    console.log('Received rating data:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    if (!req.body.ratings || 
        typeof req.body.ratings.comfortable === 'undefined' || 
        typeof req.body.ratings.safe === 'undefined' || 
        typeof req.body.ratings.overall === 'undefined') {
      return res.status(400).json({
        success: false,
        error: 'Missing required rating data (comfortable, safe, overall)'
      });
    }
    
    // Validate rating range (1-4)
    const { comfortable, safe, overall } = req.body.ratings;
    if (comfortable < 1 || comfortable > 4 || safe < 1 || safe > 4 || overall < 1 || overall > 4) {
      return res.status(400).json({
        success: false,
        error: 'Ratings must be between 1-4'
      });
    }
    
    // Validate session ID
    if (!req.body.sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing session ID'
      });
    }
    
    // Validate location
    if (!req.body.location || !req.body.location.lat || !req.body.location.lng) {
      return res.status(400).json({
        success: false,
        error: 'Missing location data'
      });
    }
    
    // Add user info
    const ratingData = {
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };
    
    // Create rating
    const rating = await Rating.create(ratingData);
    
    console.log('Rating saved successfully:', rating._id);
    
    return res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      data: rating
    });
  } catch (err) {
    console.error('Rating submission error:', err);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  }
};

// Get rating statistics
exports.getRatingStats = async (req, res) => {
  try {
    const totalRatings = await Rating.countDocuments();
    
    // Calculate average ratings
    const avgStats = await Rating.aggregate([
      {
        $group: {
          _id: null,
          avgComfortable: { $avg: '$ratings.comfortable' },
          avgSafe: { $avg: '$ratings.safe' },
          avgOverall: { $avg: '$ratings.overall' }
        }
      }
    ]);
    
    // Rating distribution for 4-point scale
    const ratingDistribution = await Rating.aggregate([
      {
        $match: {
          'ratings.overall': { $exists: true, $ne: null }
        }
      },
      {
        $bucket: {
          groupBy: '$ratings.overall',
          boundaries: [1, 2, 3, 4, 5],
          default: 'other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);
    
    // Recent trends (last 30 days)
    const recentTrends = await Rating.aggregate([
      {
        $match: {
          createdAt: { 
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
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
          avgOverall: { $avg: '$ratings.overall' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    const defaultStats = {
      avgComfortable: 0,
      avgSafe: 0,
      avgOverall: 0
    };
    
    const averageRatings = avgStats.length > 0 ? {
      comfortable: parseFloat((avgStats[0].avgComfortable || 0).toFixed(1)),
      safe: parseFloat((avgStats[0].avgSafe || 0).toFixed(1)),
      overall: parseFloat((avgStats[0].avgOverall || 0).toFixed(1))
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
    console.error('Stats query error:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get ratings by road ID
exports.getRatingsByRoad = async (req, res) => {
  try {
    const { roadId } = req.params;
    
    const ratings = await Rating.find({ 'road.id': roadId })
      .sort({ createdAt: -1 });
    
    let avgRatings = {
      comfortable: 0,
      safe: 0,
      overall: 0
    };
    
    if (ratings.length > 0) {
      ratings.forEach(rating => {
        avgRatings.comfortable += rating.ratings.comfortable;
        avgRatings.safe += rating.ratings.safe;
        avgRatings.overall += rating.ratings.overall;
      });
      
      // Calculate averages
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
    console.error('Road ratings query error:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};
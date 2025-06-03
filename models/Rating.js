const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  // 会话ID字段
  sessionId: {
    type: String,
    required: false, // 不强制要求，兼容旧数据
    index: true
  },
  
  // 位置信息 - 保持原有格式但改为Number类型
  location: {
    lat: {
      type: Number, // 改为Number类型，更适合地理计算
      required: true
    },
    lng: {
      type: Number, // 改为Number类型，更适合地理计算
      required: true
    }
  },
  
  // 道路信息
  road: {
    id: {
      type: String
    },
    name: {
      type: String,
      default: '未命名道路'
    },
    type: {
      type: String,
      default: '未知'
    }
  },
  
  // 评分信息 - 简化为三个维度，保留旧字段以兼容
  ratings: {
    // 新的三个维度（必需）
    safety: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    comfort: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    total: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    // 保留旧字段以兼容现有数据（可选）
    bikelanes: {
      type: Number,
      min: 1,
      max: 10
    },
    surface: {
      type: Number,
      min: 1,
      max: 10
    },
    traffic: {
      type: Number,
      min: 1,
      max: 10
    },
    connectivity: {
      type: Number,
      min: 1,
      max: 10
    }
  },
  
  // 选中的标签
  selectedTags: [{
    type: String
  }],
  
  // 用户信息
  ipAddress: String,
  userAgent: String,
  
  // 可选字段，用于存储首次评分时的问卷数据
  surveyData: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  
  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // 自动添加createdAt和updatedAt
});

// 创建索引以提高查询性能
RatingSchema.index({ 'location': '2dsphere' });
RatingSchema.index({ createdAt: -1 });
RatingSchema.index({ 'road.id': 1, createdAt: -1 });
RatingSchema.index({ sessionId: 1, createdAt: -1 });

// 虚拟字段：格式化的位置信息
RatingSchema.virtual('formattedLocation').get(function() {
  if (this.location && this.location.lat && this.location.lng) {
    return {
      latitude: this.location.lat,
      longitude: this.location.lng
    };
  }
  return null;
});

// 实例方法：获取评分摘要
RatingSchema.methods.getRatingSummary = function() {
  return {
    safety: this.ratings.safety,
    comfort: this.ratings.comfort,
    total: this.ratings.total,
    hasPreferences: this.selectedTags && this.selectedTags.length > 0,
    preferenceCount: this.selectedTags ? this.selectedTags.length : 0
  };
};

// 中间件：保存前验证
RatingSchema.pre('save', function(next) {
  // 验证经纬度范围
  if (this.location) {
    const { lat, lng } = this.location;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      next(new Error('无效的经纬度坐标'));
      return;
    }
  }
  
  // 验证评分值
  const { safety, comfort, total } = this.ratings;
  if (safety < 1 || safety > 10 || comfort < 1 || comfort > 10 || total < 1 || total > 10) {
    next(new Error('评分必须在1-10之间'));
    return;
  }
  
  next();
});

// 启用虚拟字段在JSON输出中显示
RatingSchema.set('toJSON', { virtuals: true });
RatingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Rating', RatingSchema);
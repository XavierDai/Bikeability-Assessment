const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  location: {
    lat: {
      type: String,
      required: true
    },
    lng: {
      type: String,
      required: true
    }
  },
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
  ratings: {
    bikelanes: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    safety: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    surface: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    traffic: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    connectivity: {
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
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Rating', RatingSchema);
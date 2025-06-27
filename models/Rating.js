const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  
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
    index: {
      type: Number
    },
    name: {
      type: String,
      default: 'Unnamed road'
    },
    type: {
      type: String,
      default: 'Unknown'
    }
  },
  
  ratings: {
    comfortable: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    safe: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    }
  },
  
  ratingReason: {
    type: String,
    default: ''
  },
  
  surveyData: {
    influencingFactors: [{
      type: String
    }],
    additionalComments: {
      type: String,
      default: ''
    }
  },
  
  ipAddress: String,
  userAgent: String,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
RatingSchema.index({ 'location.lat': 1, 'location.lng': 1 });
RatingSchema.index({ createdAt: -1 });
RatingSchema.index({ 'road.id': 1, createdAt: -1 });
RatingSchema.index({ sessionId: 1, createdAt: -1 });

// Virtual field for formatted location
RatingSchema.virtual('formattedLocation').get(function() {
  if (this.location && this.location.lat && this.location.lng) {
    return {
      latitude: parseFloat(this.location.lat),
      longitude: parseFloat(this.location.lng)
    };
  }
  return null;
});

// Instance method for rating summary
RatingSchema.methods.getRatingSummary = function() {
  return {
    comfortable: this.ratings.comfortable,
    safe: this.ratings.safe,
    overall: this.ratings.overall,
    hasInfluencingFactors: this.surveyData && this.surveyData.influencingFactors && this.surveyData.influencingFactors.length > 0,
    influencingFactorCount: this.surveyData && this.surveyData.influencingFactors ? this.surveyData.influencingFactors.length : 0
  };
};

// Pre-save validation
RatingSchema.pre('save', function(next) {
  // Validate coordinates
  if (this.location) {
    const { lat, lng } = this.location;
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    if (isNaN(latNum) || isNaN(lngNum) || lngNum < -180 || lngNum > 180 || latNum < -90 || latNum > 90) {
      next(new Error('Invalid coordinates'));
      return;
    }
  }
  
  // Validate rating values
  const { comfortable, safe, overall } = this.ratings;
  if (comfortable < 1 || comfortable > 4) {
    next(new Error('Comfortable rating must be between 1-4'));
    return;
  }
  if (safe < 1 || safe > 4) {
    next(new Error('Safe rating must be between 1-4'));
    return;
  }
  if (overall < 1 || overall > 4) {
    next(new Error('Overall rating must be between 1-4'));
    return;
  }
  
  next();
});

// Enable virtual fields in JSON output
RatingSchema.set('toJSON', { virtuals: true });
RatingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Rating', RatingSchema);
const mongoose = require('mongoose');

const marketStatusSchema = new mongoose.Schema({
  freeze: {
    type: Boolean,
    default: false, // Default is unfrozen
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const MarketStatus = mongoose.model('MarketStatus', marketStatusSchema);

module.exports = MarketStatus;


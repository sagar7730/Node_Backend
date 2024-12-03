const MarketStatus = require('../model/marketFreeze'); // Import the model

// Middleware to check if the market is frozen
const marketFreezeMiddleware = async (req, res, next) => {
  try {
    // Fetch the freeze status from the database
    const marketStatus = await MarketStatus.findOne();

    if (marketStatus && marketStatus.freeze) {
      return res.status(503).json({ message: "The market is currently frozen. Please wait until it's unfrozen." });
    }

    // If not frozen, allow the request to proceed
    next();
  } catch (error) {
    console.error("Error checking market freeze status:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = marketFreezeMiddleware;



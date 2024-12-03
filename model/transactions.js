const mongoose = require("mongoose");

// Define the schema for players data in transactions
const playerTransactionSchema = new mongoose.Schema(
  {
    player_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    profile_image: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    share_quantity: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
); // Disable _id for subdocuments if not needed

// Define the schema for user data in transactions
const userTransactionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    profile_image: {
      type: String,
      required: true,
    },
    credits: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
); // Disable _id for subdocuments if not needed

// Define the main transactions schema
const transactionsSchema = new mongoose.Schema(
  {
    user_data: userTransactionSchema, // Full user details
    players_data: [playerTransactionSchema], // Array of player data
    opening_credits: {
      type: Number,
      required: true,
    },
    closing_credits: {
      type: Number,
      required: true,
    },
    total_credits: {
      type: Number,
      required: true,
    },
    grand_total_credits: {
      type: Number,
      required: true,
    },
    by_Admin : {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("transactions", transactionsSchema);

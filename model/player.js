const mongoose = require("mongoose");
let validator = require("validator");

// Define a subdocument schema for value_data to include timestamps
const valueDataSchema = new mongoose.Schema(
  {
    value: {
      type: Number,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now, // Automatically set the createdAt field to the current date
    },
  },
  { _id: false } // Disable _id for subdocuments if not needed
);

const playerSchema = new mongoose.Schema(
  {
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
    // ahi value data atle ke player ni value ni history save thashe
    value_data: [valueDataSchema], // Use the subdocument schema for the array
    selected: {
      type: Boolean,
      default: false, // By default, a player is not selected
    },
  },
  { timestamps: true }
);



module.exports = mongoose.model("player", playerSchema);

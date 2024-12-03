// // const mongoose = require('mongoose');
// // let validator = require("validator");

// // const userSchema = new mongoose.Schema({
// //     name: {
// //         type: String,
// //        required: true,
// //     },
// //     email: {
// //         type: String,
// //         trim: true,
// //         maxlength: 100,
// //         required: "Email address is required",
// //         validate: {
// //           validator: (value) => validator.isEmail(value),
// //           message: "Please fill a valid email",
// //         },
// //     },
// //     password: {
// //         type: String,
// //        required: true,
// //     },
// //     profile_image: {
// //         type: String,
// //         required: true,
// //     },
// //     credits: {
// //         type : String,
// //         default: 500,
// //     },
// //     teamData: {
// //         type : Array,
// //     },

// // }, { timestamps: true });

// // module.exports = mongoose.model('user', userSchema);

// const mongoose = require("mongoose");
// let validator = require("validator");

// // Define the player schema (with player ObjectId and share_quantity)
// const playerDataSchema = new mongoose.Schema(
//   {
//     _id: {
//       type: mongoose.Schema.Types.ObjectId, // Store the player's ObjectId
//       required: true,
//     },
//     name: {
//       type: String,
//       required: true,
//     },
//     profile_image: {
//       type: String,
//     },
//     value: {
//       type: Number,
//       required: true,
//     },
//     share_quantity: {
//       type: Number,
//       required: true,
//       default: 1,
//     },
//     newPassword:{
//       type:Number
//     },
//     confirmPassword :{
//       type:Number
//     },
//     OTP :{
//       type:Number
//     }
//   },
//   { timestamps: true } // Automatically add createdAt and updatedAt fields
// );

// const teamSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//     },
//     profile_image: {
//       type: String,
//       required: false,
//       default: "default_team.png", // Provide a default value if no image is uploaded
//     },
//     players: [playerDataSchema], // Array of player data
//   },
//   { timestamps: true } // Automatically add createdAt and updatedAt fields
// );

// const userSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//     },
//     email: {
//       type: String,
//       trim: true,
//       maxlength: 100,
//       required: "Email address is required",
//       validate: {
//         validator: (value) => validator.isEmail(value),
//         message: "Please fill a valid email",
//       },
//     },
//     password: {
//       type: String,
//       required: true,
//     },
//     profile_image: {
//       type: String,
//       required: false,
//       default: "default_profile.png",
//     },
//     credits: {
//       type: Number, // Changed from String to Number
//       default: 500,
//     },
//     team: teamSchema, // Nested team schema
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("User", userSchema);


const mongoose = require("mongoose");
let validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      maxlength: 100,
      required: "Email address is required",
      validate: {
        validator: (value) => validator.isEmail(value),
        message: "Please fill a valid email",
      },
    },
    password: {
      type: String,
      required: true,
    },
    profile_image: {
      type: String,
      required: false,
      default: "default_profile.png",
    },
    credits: {
      type: Number,
      default: 500,
    },
    team: {
      name: String,
      profile_image: String,
      players: [{
        name: String,
        value: Number,
        share_quantity: Number,
      }]
    },

    // Add OTP and resetPasswordExpire directly to the user schema
    OTP: {
      type: Number,
    },
    resetPasswordExpire: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

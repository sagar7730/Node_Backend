let mongoose = require("mongoose");
let schema = mongoose.Schema;
let validator = require("validator");

let admin = new schema({
  name:{
     type:String,
     required:true
  },
  surname:{
     type:String,
     required:true
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
    required: [true, "Password is Require"],
  }
});

let admin_model = mongoose.model("admin", admin);
module.exports = admin_model;



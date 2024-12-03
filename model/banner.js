let mongoose = require("mongoose");
let schema = mongoose.Schema;

let bannertext = new schema({
  text:{
     type:String,
     required:true
  }
});

let banner_notification = mongoose.model("bannertext", bannertext);
module.exports = banner_notification;



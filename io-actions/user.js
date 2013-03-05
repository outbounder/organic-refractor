var runtime = require("../models/runtime");

module.exports = function(config){
  return {
    "GET": function(data, callback){
      runtime.user.refreshCWD();
      callback(runtime.user);  
    }
  }
}
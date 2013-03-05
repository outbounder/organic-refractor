var fs = require("fs");

module.exports = function(config){
  return {
    "GET": function(data, callback) {
      fs.readFile(data.target, function(err, contents){
        if(err) return callback(err);
        callback(err, contents.toString());
      });
    }
  }
}
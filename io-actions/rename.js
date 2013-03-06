var fs = require('fs');
var path = require("path");
var shelljs = require("shelljs");

module.exports = function(config){
  return {
    "PUT": function(data, callback) {
      shelljs.mkdir('-p', path.dirname(data.to));
      fs.rename(data.from, data.to, function(err){
        callback(err, true);
      })
    }
  }
}
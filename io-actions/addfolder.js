var shelljs = require("shelljs");

module.exports = function(config){
  return {
    "POST": function(data, callback) {
      shelljs.mkdir('-p', data.target);
      callback(null, true);
    }
  }
}
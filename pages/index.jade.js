require("./../client/vendor/index.js");
config = require("config")

jadeCompile = function(path){
  var compiled = jade.compile(path);
  return function(data) {
    data = data || {};
    data.t = $.t;
    return compiled(data);
  }
};

runtime = {};

var User = require("./../client/models/User.js");
var Router = require("./../client/index.js");

runtime.plasma = io.connect(config.socketio);
runtime.plasma.emit("GET /user", {}, function(data){
  runtime.user = new User(data);
  runtime.router = new Router();
  Backbone.history.start({pushState: false, trigger: true});
});
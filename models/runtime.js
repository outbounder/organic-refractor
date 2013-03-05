var User = require("./User");

module.exports.user = new User({
  username: process.env['USER'],
  home: process.env['HOME']
});
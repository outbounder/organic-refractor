var CurrentDirectory = require("./CurrentDirectory");

module.exports.currentDirectory = new CurrentDirectory({
  username: process.env['USER'],
  home: process.env['HOME']
});
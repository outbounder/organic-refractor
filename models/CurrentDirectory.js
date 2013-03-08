var _ = require("underscore");
var fs = require("fs");
var path = require("path");
var Git = require("git-wrapper");

// dirTree borrowed from The internet
var index = {};

var dirTree = function(filename) {
    var stats = fs.lstatSync(filename),
    info = {
      id: filename,
      path: filename,
      label: path.basename(filename)
    };
    index[info.id] = info;

    if (stats.isDirectory()) {
      info.type = "folder";
      info.children = fs.readdirSync(filename).map(function(child) {
        if(child == "node_modules") return;
        if(child.indexOf(".") === 0) return;
        
        return dirTree(filename + '/' + child);
      }).sort(function(a,b){
        if(a.type == "file" && b.type == "folder")
          return 1;
        if(a.type == "folder" && b.type == "file")
          return -1;
        if(a.label < b.label)
          return -1
        else
        if(a.label > b.label)
          return 1
        else
          return 0
      });
    } else {
      // Assuming it's a file. In real life it could be a symlink or
      // something else!
      info.type = "file";
    }
    
    if(info.children)
      info.children = _.compact(info.children);

    return info;
}

module.exports = function(data){
  _.extend(this, data);
}

module.exports.prototype.refresh = function(callback){
  var self = this;
  index = {};
  this.tree = dirTree(process.cwd());
  this.cwd = process.cwd();
  this.git = new Git();
  this.git.exec("status", function(err, msg){
    if(err) return callback(err);
    self.git.status = msg;
    callback(null, self);
  })
}

module.exports.prototype.toJSON = function(){
  return {
    tree: this.tree,
    cwd: this.cwd,
    git: {
      status: this.git.status
    },
    timestamp: new Date()
  }
}

module.exports.prototype.pathToNode = function(path) {
  return index[path];
}
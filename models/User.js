var _ = require("underscore");
var fs = require("fs");
var path = require("path");


var dirTree = function(filename) {
    var stats = fs.lstatSync(filename),
    info = {
        path: filename,
        label: path.basename(filename)
    };

    if (stats.isDirectory()) {
        info.type = "folder";
        info.children = fs.readdirSync(filename).map(function(child) {
          if(child == "node_modules") return {
            path: filename+"/"+child, 
            label: "node_modules", 
            type: "folder", 
            children: []
          }
          
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

    return info;
}

module.exports = function(data){
  _.extend(this, data);
}

module.exports.prototype.refreshCWD = function(){
  this.currentDirectory = dirTree(process.cwd());
  this.cwd = process.cwd();
  return this;
}
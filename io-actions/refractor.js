var runtime = require("../models/runtime");
var required = require('../xlib/required');
var child_process = require("child_process");

var path = require("path");
var async = require("async");
var shelljs = require('shelljs');
var fs = require('fs');
var _ = require('underscore');

var walk = function(root, collector, callback, list, walkData){
  walkData = walkData || {counter: 0};
  list = list || [];
  if(root.type == "folder") {
    for(var i = 0; i<root.children.length; i++)
      if(root.children[i].type == "file")
        walkData.counter += 1;
    for(var i = 0; i<root.children.length; i++)
      walk(root.children[i], collector, callback, list, walkData)
  } else { // file
    collector(root.path, function(err, result){
      walkData.counter -= 1;
      if(result) list.push(result);
      if(walkData.counter == 0)
        callback(err, list);
    })
  }
}

var pool = new (require("fork-pool"))(__dirname+"/../findFilesDependingOn.js", null, null, {});


var findFilesDependingOn = function(tree, from, callback){
  pool.enqueue({tree: tree, from: from}, function(err, a){
    if(err) return callback(err);
    callback(err, a.stdout);
  });
}

var refractorFileDependency = function(to, resolveForReal){
  return function(entry, next){
    fs.readFile(entry.path, function(err, data){
      if(err) return next(err);
      var dirname = resolveForReal(path.dirname(entry.path));
      var relative = path.relative(dirname, to);
      if(relative.indexOf(".") !== 0 && relative.indexOf("/") !== 0)
        relative = "./"+relative;
      if(relative.indexOf("/index.js") !== -1)
        relative = relative.replace("/index.js", "");
      if(relative.indexOf(".js") !== -1)
        relative = relative.replace(".js", "");
      fs.writeFile(entry.path, data.toString().replace(entry.id, relative), function(err){
        next(err, {change: {from: entry.id, to: relative}, sourcefile: entry.path});  
      });
    })
  }
}

var refractorFileSelf = function(from, to, resolveForReal, callback){
  if(path.extname(to) != ".js") {
    shelljs.mkdir('-p', path.dirname(to));
    shelljs.cp('-f', from, to);
    callback(null);
  } else {
    required(from, {ignoreMissing: true}, function(err, deps){
      if(err) console.log(from, to, err);
      if(err) return callback(err);
      fs.readFile(from, function(err, data){
        if(err) return callback(err);
        var content = data.toString();
        for(var i = 0; i<deps.length; i++) {
          if(deps[i].core) continue;
          var filename = resolveForReal(deps[i].filename);
          var relative = path.relative(path.dirname(to), filename);
          if(relative.indexOf(".") !== 0 && relative.indexOf("/") !== 0)
            relative = "./"+relative;
          if(relative.indexOf("/index.js") !== -1)
            relative = relative.replace("/index.js", "");
          if(relative.indexOf(".js") !== -1)
            relative = relative.replace(".js", "");
          content = content.replace(deps[i].id, relative);
        }
        shelljs.mkdir('-p', path.dirname(to));
        fs.writeFile(to, content, callback);
      })
    });
  }
}

var refractorFile = function(from, to, entries, resolveForReal, callback) {
  refractorFileSelf(from, to, resolveForReal, function(err){
    if(err) return callback(err);
    async.map(entries, refractorFileDependency(to, resolveForReal), callback);
  });
}

module.exports = function(config){
  return {
    "GET /file": function(data, callback){
      runtime.currentDirectory.refresh(function(err, currentDirectory){
        if(err) return callback(err);
        var tree = currentDirectory.tree;
        findFilesDependingOn(tree, data.from, callback);
      });
    },
    "POST /file": function(data, callback) {
      var resolveForReal = function(f){
        return f;
      }
      refractorFile(data.from, data.to, data.entries, resolveForReal, function(err, changes){
        if(err) return callback(err);
        fs.unlink(data.from, function(err){
          callback(err, changes);
        });
      })
    },
    "GET /folder": function(data, callback) {
      runtime.currentDirectory.refresh(function(err, currentDirectory){
        if(err) return callback(err);
        var tree = currentDirectory.tree;
        var from = runtime.currentDirectory.pathToNode(data.from);
        // get all files bellow the dir with .js extension
        walk(from, function(file, next){
          next(null, {path: file});
        }, function(err, files){
          var fileDeps = {};
          async.forEach(files, function(file, next){
            findFilesDependingOn(tree, file.path, function(err, files){
              if(err) return next(err);
              fileDeps[file.path] = files;
              next(null)
            });
          }, function(err){
            if(err) return callback(err);
            callback(null, {files: files, deps: fileDeps});
          })
        })
      });
    },
    "POST /folder": function(data, callback) {
      runtime.currentDirectory.refresh(function(err, currentDirectory){
        if(err) return callback(err);
        var from = runtime.currentDirectory.pathToNode(data.from);
        var getToPath = function(filepath) {
          return data.to+filepath.replace(data.from, "")
        }
        var counter = _.keys(data.entries.deps).length;
        var changes = [];
        var resolveForReal = function(f){
          return f.replace(data.from, data.to);
        }
        var next = function(err, filepath, c){
          changes = changes.concat(c).concat([{path: filepath}]);
          counter -= 1;
          if(counter == 0) {
            if(!err)
              shelljs.rm('-rf', data.from);
            callback(err, changes);
          }
        }
        shelljs.cp('-Rf', data.from+"/*", data.to);
        for(var key in data.entries.deps) {
          (function(filepath, entries){
            refractorFile(filepath, getToPath(filepath), entries, resolveForReal, function(err, changes){
              next(err, filepath, changes);
            })  
          })(key, data.entries.deps[key]);
        }
      });
    }
  }
}
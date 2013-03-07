var runtime = require("../models/runtime");
var required = require('required');
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

var dependingFilesCollector = function(from){
  return function(file, next){
    if(path.extname(file) != ".js") return next();
    required(file, {ignoreMissing: true}, function(err, deps){
      if(!deps || err) return next(null);
      for(var i = 0; i<deps.length; i++)
        if(deps[i].filename == from) {
          deps[i].path = file;
          delete deps[i].deps; // we do not care for these...
          return next(null, deps[i]); // give the reflection dep back
        }
      next();
    })
  }
}

var findFilesDependingOn = function(tree, from, callback){
  walk(tree, dependingFilesCollector(from), function(err, list){
    callback(err, list);
  })
}

var refractorFileDependency = function(to){
  return function(entry, next){
    fs.readFile(entry.path, function(err, data){
      if(err) return next(err);
      var relative = path.relative(path.dirname(entry.path), to);
      if(relative.indexOf(".") !== 0 && relative.indexOf("/") !== 0)
        relative = "./"+relative;
      fs.writeFile(entry.path, data.toString().replace(entry.id, relative), function(err){
        next(err, {change: {from: entry.id, to: relative}, sourcefile: entry.path});  
      });
    })
  }
}

var refractorFileSelf = function(from, to, callback){
  required(from, {ignoreMissing: true}, function(err, deps){
    fs.readFile(from, function(err, data){
      if(err) return callback(err);
      var content = data.toString();
      for(var i = 0; i<deps.length; i++) {
        if(deps[i].core) continue;
        var relative = path.relative(path.dirname(to), deps[i].filename);
        if(relative.indexOf(".") !== 0 && relative.indexOf("/") !== 0)
          relative = "./"+relative;
        content = content.replace(deps[i].id, relative);
      }
      shelljs.mkdir('-p', path.dirname(to));
      fs.writeFile(to, content, function(err){
        if(err) return callback(err);
        fs.unlink(from, function(err){
          callback(err);  
        });
      });
    })
  });
}

var refractorFile = function(from, to, entries, callback) {
  async.map(entries, refractorFileDependency(to), function(err, results){
    if(!err) {
      refractorFileSelf(from, to, function(err){
        if(err) return callback(err);
        callback(null, results);
      });
    } else
      callback(err);
  });
}

module.exports = function(config){
  return {
    "GET /file": function(data, callback){
      var tree = runtime.currentDirectory.refresh().tree;
      findFilesDependingOn(tree, data.from, function(err, files){
        callback(err, files);
      })
    },
    "POST /file": function(data, callback) {
      refractorFile(data.from, data.to, data.entries, function(err, changes){
        callback(err, changes);
      })
    },
    "GET /folder": function(data, callback) {
      var tree = runtime.currentDirectory.refresh().tree;
      var from = runtime.currentDirectory.pathToNode(data.from);
      // get all files bellow the dir with .js extension
      walk(from, function(file, next){
        if(path.extname(file) == ".js")
          next(null, {path: file});
        else
          next();
      }, function(err, files){
        // get all dependencies (it will be slow...)
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
    },
    "POST /folder": function(data, callback) {
      var tree = runtime.currentDirectory.refresh().tree;
      var from = runtime.currentDirectory.pathToNode(data.from);
      // get all files bellow the dir with .js extension
      walk(from, function(file, next){
        if(path.extname(file) == ".js")
          next(null, {path: file});
        else
          next();
      }, function(err, files){
        async.map(files, function(file, next){
          refractorFile(from(file), to(file), data.entries[file], function(err, changes){
            next(err, changes);
          })
        }, function(err, changes){
          changes = _.flatten(changes);
          var results = files.concat(changes);
          callback(null, results);
        })
      })
    }
  }
}
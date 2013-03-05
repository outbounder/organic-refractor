var runtime = require("../models/runtime");
var required = require('required');
var path = require("path");
var async = require("async");
var shelljs = require('shelljs');
var fs = require('fs');

var counter = 0; // XXX global counter, not good

var walk = function(root, collect, callback, list){
  list = list || [];
  if(root.type == "folder") {
    for(var i = 0; i<root.children.length; i++)
      walk(root.children[i], collect, callback, list)
  } else { // file
    counter += 1;
    collect(root.path, function(err, result){
      counter -=1;
      if(result) list.push(result);
      if(counter == 0)
        callback(err, list);
    })
  }
}

var findFilesDependingOn = function(from, callback){
  var root = runtime.user.refreshCWD().currentDirectory;
  counter = 0;
  walk(root, function(file, next){
    if(path.extname(file) != ".js") return setTimeout(next,10); // async need
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
  }, function(err, list){
    callback(err, list);
  })
}

var findFilesDependingOnAndRefractor = function(from, to, entries, callback) {
  async.map(entries, function(entry, next){
    fs.readFile(entry.path, function(err, data){
      if(err) return next(err);
      var relative = "./"+path.relative(path.dirname(entry.path), to);
      fs.writeFile(entry.path, data.toString().replace(entry.id, relative), function(err){
        next(err, {change: {from: entry.id, to: relative}, sourcefile: entry.path});  
      });
    })
  }, function(err, results){
    if(!err) {
      required(from, {ignoreMissing: true}, function(err, deps){
        fs.readFile(from, function(err, data){
          if(err) return callback(err);
          var content = data.toString();
          for(var i = 0; i<deps.length; i++) {
            var relative = "./"+path.relative(path.dirname(to), deps[i].filename);
            content = content.replace(deps[i].id, relative);
          }
          shelljs.mkdir('-p', path.dirname(to));
          fs.writeFile(to, content, function(err){
            if(err) return callback(err);
            fs.unlink(from, function(err){
              callback(err, results);  
            });
          });
        })
      });
    } else
      callback(err, results);
  });
}

module.exports = function(config){
  return {
    "GET": function(data, callback){
      findFilesDependingOn(data.from, function(err, files){
        callback(err, files);
      })
    },
    "POST": function(data, callback) {
      findFilesDependingOnAndRefractor(data.from, data.to, data.entries, function(err, changes){
        callback(err, changes);
      })
    }
  }
}
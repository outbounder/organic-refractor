var required = require('../xlib/required');

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
          var data = {
            path: file,
            filename: deps[i].filename,
            id: deps[i].id
          }
          return next(null, data);
        }
      next();
    })
  }
}

process.on("message", function(msg){
  walk(msg.tree, dependingFilesCollector(msg.from), function(err, list){  
    process.send({err: err, list: list});
    process.exit(0);
  });
});
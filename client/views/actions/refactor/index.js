var path = require("path");

module.exports = Backbone.View.extend({
  template: jadeCompile(require("./index.jade")),
  actionChanges: jadeCompile(require("./changes.jade")),
  events: {
    "click .executeBtn": "execute",
    "click .file": "showFile",
    "click .targetFileBtn": "showTargetFile",
    "click .cancelBtn": "remove"
  },
  initialize: function(){
    var type = this.type = this.model.get("moved_node").type;
    var self = this;
    var from = this.model.get("moved_node").path;
    var eventName = "GET /refractor/"+type;
    runtime.plasma.emit(eventName, {from: from}, function(err, files){
      if(type == "folder") {
        self.entries = files;
        self.collection = [].concat(files.files);
        for(var key in files.deps)
          for(var i = 0; i<files.deps[key].length; i++)
            self.collection.push(files.deps[key][i]);
      } else
        self.collection = files;
        
      if(self.collection.length > 0)
        self.$(".files").html(self.actionChanges({
          collection: self.collection,
          relative: function(file) {
            var v = path.relative(type=="folder"?from:path.dirname(from), file);
            if(v.indexOf(".") !== 0 && v.indexOf("/") !== 0)
              return "./"+v;
            else
              return v;
          }
        }));
      else
        self.$(".files").html("no files related found");
    });
  },
  showFile: function(e){
    e.preventDefault();

    var self = this;
    var target = $(e.currentTarget).attr("data-path");
    runtime.plasma.emit("GET /file", {
      target: target
    }, function(err, contents) {
      if(contents) {
        self.$(".selectedFilePath").html(target);
        self.$(".selectedFilecontents").html(contents);
      } else {
        self.$(".selectedFilePath").html(target);
        self.$(".selectedFilecontents").html(err || "empty");
      }
    });
  },
  showTargetFile: function(e){
    e.preventDefault();
    if(this.model.get("moved_node").type == "folder") 
      return alert("can't show folder");
    
    var self = this;
    runtime.plasma.emit("GET /file", {
      target: this.model.get("moved_node").path
    }, function(err, contents) {
      if(contents) {
        self.$(".selectedFilePath").html(self.model.get("moved_node").path);
        self.$(".selectedFilecontents").html(contents);
      }
    });
  },
  execute: function(){
    var self = this;
    var frompath = this.model.get("moved_node").path;
    var topath = this.model.get("target_node").path+"/"+this.$(".filename").val();
    if(this.model.get("position") == "after" || this.model.get("position") == "before")
      topath = path.dirname(this.model.get("target_node").path)+"/"+this.$(".filename").val();
    var eventName = "POST /refractor/"+this.model.get("moved_node").type;
    runtime.plasma.emit(eventName, {
      from: frompath,
      to: topath,
      entries: this.type == "folder"?this.entries:this.collection
    }, function(err, results){
      if(err) {
        alert(err);
        return console.log(err);
      }
      self.remove();
      self.trigger("success", topath);
    })
  },
  render: function(){
    this.$el.html(this.template({model: this.model}));
    return this;
  }
})
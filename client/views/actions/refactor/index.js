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
        console.log(files);
        self.entries = files;
        self.collection = [].concat(files.files);
        for(var key in files.deps)
          for(var i = 0; i<files.deps[key].length; i++)
            self.collection.push(files.deps[key][i]);
      } else
        self.collection = files;
        
      if(self.collection.length > 0)
        self.$(".files").html(self.actionChanges({collection: self.collection}));
      else
        self.$(".files").html("no files related found");
    });
  },
  showFile: function(e){
    e.preventDefault();
    var self = this;
    runtime.plasma.emit("GET /file", {
      target: $(e.currentTarget).html()
    }, function(err, contents) {
      if(contents) {
        self.$(".selectedFilePath").html($(e.currentTarget).html());
        self.$(".selectedFilecontents").html(contents);
      }
    });
  },
  showTargetFile: function(e){
    e.preventDefault();
    if(this.model.get("moved_node").type == "folder") return;
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
    var eventName = "POST /refractor/"+this.model.get("moved_node").type;
    runtime.plasma.emit(eventName, {
      from: frompath,
      to: topath,
      entries: this.type == "folder"?this.entries:this.collection
    }, function(err, results){
      if(err) return console.log(err);
      self.remove();
      self.trigger("success", topath);
    })
  },
  render: function(){
    this.$el.html(this.template({model: this.model}));
    return this;
  }
})
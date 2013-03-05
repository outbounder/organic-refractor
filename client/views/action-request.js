var path = require("path");

module.exports = Backbone.View.extend({
  template: jadeCompile(require("./action-request.jade")),
  actionChanges: jadeCompile(require("./action-request-changes.jade")),
  events: {
    "click .executeBtn": "execute",
    "click .file": "showFile",
    "click .targetFileBtn": "showTargetFile",
    "click .cancelBtn": "remove"
  },
  initialize: function(){
    var self = this;
    var from = this.model.get("moved_node").path;
    runtime.plasma.emit("GET /refractor", {from: from}, function(err, files){
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
    runtime.plasma.emit("POST /refractor", {
      from: frompath,
      to: topath,
      entries: this.collection
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
var path = require("path");

module.exports = Backbone.View.extend({
  template: jadeCompile(require("./index.jade")),
  items: jadeCompile(require("./items.jade")),
  events: {
    "click .file": "showFile",
    "click .targetFileBtn": "showTargetFile",
  },
  initialize: function(){
    var type = this.type = this.model.get("type");
    var self = this;
    var from = this.model.get("path");
    var eventName = "GET /refractor/"+type;
    this.startMoment = moment();
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
        self.$(".files").html(self.items({
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
      self.$(".time").html(moment(self.startMoment).fromNow());
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
    if(this.model.get("type") == "folder") 
      return alert("can't show folder");

    var self = this;
    runtime.plasma.emit("GET /file", {
      target: this.model.get("path")
    }, function(err, contents) {
      if(contents) {
        self.$(".selectedFilePath").html(self.model.get("path"));
        self.$(".selectedFilecontents").html(contents);
      }
    });
  },
  render: function(){
    this.$el.html(this.template({model: this.model}));
    return this;
  }
})
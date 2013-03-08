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
        self.$(".files").html(self.items({collection: self.collection}));
      else
        self.$(".files").html("no files related found");
      self.$(".time").html(moment(self.startMoment).fromNow());
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
      } else {
        self.$(".selectedFilePath").html($(e.currentTarget).html());
        self.$(".selectedFilecontents").html("empty");
      }
    });
  },
  showTargetFile: function(e){
    e.preventDefault();
    if(this.model.get("type") == "folder") return;

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
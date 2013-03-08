var path = require("path");

module.exports = Backbone.View.extend({
  template: jadeCompile(require("./index.jade")),
  items: jadeCompile(require("./items.jade")),
  events: {
    "click .executeBtn": "execute",
    "click .cancelBtn": "remove",
    "click .file": "showFile"
  },
  initialize: function(){
    var type = this.type = this.model.get("type");
    var self = this;
    var from = this.model.get("path");
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
        self.$(".files").html(self.items({collection: self.collection}));
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
      } else {
        self.$(".selectedFilePath").html($(e.currentTarget).html());
        self.$(".selectedFilecontents").html("empty");
      }
    });
  },
  execute: function(){
    var self = this;
    var frompath = this.model.get("path");
    var topath = path.dirname(this.model.get("path"))+"/"+this.$(".path").val();
    var eventName = "POST /refractor/"+this.model.get("type");
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
    this.$el.html(this.template({
      model: this.model, 
      basename: path.basename(this.model.get("path"))
    }));
    return this;
  }
})
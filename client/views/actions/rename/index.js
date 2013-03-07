var path = require("path");

module.exports = Backbone.View.extend({
  template: jadeCompile(require("./index.jade")),
  events: {
    "click .executeBtn": "execute",
    "click .cancelBtn": "remove"
  },
  initialize: function(){

  },
  execute: function(){
    var self = this;
    var frompath = this.model.get("path");
    var topath = path.dirname(this.model.get("path"))+"/"+this.$(".path").val();
    runtime.plasma.emit("PUT /rename", {
      from: frompath,
      to: topath,
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
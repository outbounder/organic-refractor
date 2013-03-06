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
    var topath = this.$(".path").val();
    runtime.plasma.emit("POST /addfolder", {
      target: this.$(".path").val()
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
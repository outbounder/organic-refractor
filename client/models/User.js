var CurrentDirectory = require("./CurrentDirectory");

module.exports = Backbone.Model.extend({
  initialize: function(attrs){
    this.currentDirectory = new CurrentDirectory({entries: attrs.tree});
  },
  parse: function(data){
    if(!this.currentDirectory)
      this.currentDirectory = new CurrentDirectory({entries: data.tree});
    else
      this.currentDirectory.set("entries", data.tree, {silent: true});
  }
});
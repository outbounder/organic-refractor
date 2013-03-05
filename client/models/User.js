var CurrentDirectory = require("./CurrentDirectory");

module.exports = Backbone.Model.extend({
  initialize: function(attrs){
    this.currentDirectory = new CurrentDirectory({entries: attrs.currentDirectory});
  }
});
var Mainframe = require("./views/mainframe");

module.exports = Backbone.Router.extend({

  routes: {
    "": "landing"
  },

  landing: function(){
    var view = new Mainframe({
      model: runtime.user, 
      el: $(".container")
    });
    view.render();
  }
});
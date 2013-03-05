var ActionRequest = require("./action-request");

module.exports = Backbone.View.extend({
  template: jadeCompile(require("./mainframe.jade")),
  
  initialize: function(options){
    this.model.on("change", this.render, this);
  },
  render: function(){
    var self = this;

    this.$el.html(this.template({
      model: this.model
    }));
    
    this.$(".treeview").tree({
      data: this.model.currentDirectory.toTreeJSON(),
      dragAndDrop: true,
      autoOpen: 0,
      selectable: true
    }).bind("tree.move", function(e){
      e.preventDefault();

      if(self.currentActionRequest)
        self.currentActionRequest.remove();
      self.$(".filecontents").hide();

      var view = self.currentActionRequest = new ActionRequest({model: new Backbone.Model(e.move_info)});
      view.on("success", function(topath){
        e.move_info.moved_node.path = topath;
        e.move_info.do_move();
      });
      self.$(".actionRequest").html(view.render().$el);
    }).bind("tree.click", function(e){
      runtime.plasma.emit("GET /file", {
        target: e.node.path
      }, function(err, contents) {
        if(contents) {
          self.$(".filecontents").html(contents);
          self.$(".filecontents").show();
        }
      })
    })
    return this;
  }
});
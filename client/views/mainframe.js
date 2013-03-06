var _path = require("path");

var ActionRequest = require("./actions/refactor/index.js");
var RenameActionRequest = require("./actions/rename/index.js");
var AddFolderActionRequest = require("./actions/addfolder/index.js");

module.exports = Backbone.View.extend({
  template: jadeCompile(require("./mainframe.jade")),
  treeNodeMenu: jadeCompile(require("./treeNodeMenu.jade")),

  events: {
    "mouseover .node": "showMenu",
    "mouseout .node": "hideMenu",
    "click .node .icon-edit": "addRenameRequest",
    "click .node .icon-folder-close": "addFolderRequest"
  },
  
  initialize: function(options){
    this.model.on("change", this.render, this);
  },

  showMenu: function(e){
    e.preventDefault();
    var $el = $(e.currentTarget);
    $el.find(".icon-folder-close").show();
    $el.find(".icon-edit").show();
  },
  hideMenu: function(e){
    e.preventDefault();
    var $el = $(e.currentTarget);
    $el.find(".icon-folder-close").hide();
    $el.find(".icon-edit").hide();
  },
  addRenameRequest: function(e){
    e.preventDefault();
    var self = this;
    if(this.currentActionRequest)
      this.currentActionRequest.remove();
    this.$(".filecontents").hide();

    var view = this.currentActionRequest = new RenameActionRequest({model: new Backbone.Model({
      path: $(e.currentTarget).attr("data-path")
    })});
    view.on("success", function(path){
      var $tree = self.$(".treeview");
      var node = $tree.tree('getNodeById', $(e.currentTarget).attr('data-path'))
      node.path = path;
      node.label = _path.basename(path);
      node.nodeName = node.label;
      $tree.tree('updateNode', node, self.treeNodeMenu({model: node}));
    });
    this.$(".actionRequest").html(view.render().$el);
    return false;
  },

  addFolderRequest: function(e){
    e.preventDefault();

    if(this.currentActionRequest)
      this.currentActionRequest.remove();
    this.$(".filecontents").hide();

    var view = this.currentActionRequest = new AddFolderActionRequest({model: new Backbone.Model({
      path: $(e.currentTarget).attr("data-path")
    })});
    view.on("success", function(path){
      var $tree = self.$(".treeview");
      var node = $tree.tree('getNodeById', $(e.currentTarget).attr('data-path'))
      $tree.tree('appendNode', {
        path: path,
        label: _path.basename(path),
        id: path,
        type: "folder",
        children: []
      }, node);
    });
    this.$(".actionRequest").html(view.render().$el);
    return false;
  },

  render: function(){
    var self = this;

    this.$el.html(this.template({
      model: this.model
    }));
    
    this.$(".treeview").tree({
      data: this.model.currentDirectory.toTreeJSON(function(node){
        return self.treeNodeMenu({model: node})
      }),
      dragAndDrop: true,
      autoOpen: 0,
      selectable: true,
      autoEscape: false
    }).bind("tree.move", function(e){
      e.preventDefault();

      if(self.currentActionRequest)
        self.currentActionRequest.remove();
      self.$(".filecontents").hide();

      var view = self.currentActionRequest = new ActionRequest({model: new Backbone.Model(e.move_info)});
      view.on("success", function(topath){

        // update the path value after refactoring
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
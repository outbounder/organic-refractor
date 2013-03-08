var _path = require("path");

var ActionRequest = require("../actions/refactor");
var RenameActionRequest = require("../actions/rename");
var AddFolderActionRequest = require("../actions/addfolder");
var RelatedRequest = require("../actions/related");

module.exports = Backbone.View.extend({
  template: jadeCompile(require("./index.jade")),
  treeNodeMenu: jadeCompile(require("./treeNodeMenu.jade")),

  events: {
    "mouseover .node": "showMenu",
    "mouseout .node": "hideMenu",
    "click .node .icon-edit": "addRenameRequest",
    "click .node .icon-folder-close": "addFolderRequest",
    "click .updateBtn": "refreshTree"
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

  refreshTree: function(e){
    if(e) 
      e.preventDefault();
    var self = this;
    var $tree = self.$(".treeview");
    this.$(".updateBtn").addClass("disabled");
    runtime.plasma.emit("GET ", {}, function(err, data){
      if(err) return alert(err);
      self.model.set(self.model.parse(data));
      self.$(".updateBtn").removeClass("disabled");
    });
  },

  addRenameRequest: function(e){
    e.preventDefault();
    var self = this;
    if(this.currentActionRequest)
      this.currentActionRequest.remove();

    var pathToChange = $(e.currentTarget).attr("data-path");
    
    var node = $tree.tree('getNodeById', pathToChange);

    var view = this.currentActionRequest = new RenameActionRequest({model: new Backbone.Model(node)});
    view.on("success", function(path){
      self.refreshTree();
    });
    this.$(".actionRequest").html(view.render().$el);
    return false;
  },

  addFolderRequest: function(e){
    e.preventDefault();
    var self = this;
    if(this.currentActionRequest)
      this.currentActionRequest.remove();

    var pathToAddFolderTo = $(e.currentTarget).attr("data-path");
    var $tree = self.$(".treeview");
    var node = $tree.tree('getNodeById', pathToAddFolderTo);
    console.log(node);
    var view = this.currentActionRequest = new AddFolderActionRequest({model: new Backbone.Model({
      path: pathToAddFolderTo
    })});
    view.on("success", function(path){
      var data = {
        path: path,
        label: _path.basename(path),
        id: path,
        type: "folder",
        children: []
      };
      $tree.tree('appendNode', data, node);
    });
    this.$(".actionRequest").html(view.render().$el);
    return false;
  },

  render: function(){
    var self = this;
    console.log("RENDER");

    this.$el.html(this.template({
      model: this.model
    }));
    var $tree = self.$(".treeview");
    $tree.tree({
      data: this.model.currentDirectory.toTreeJSON(),
      dragAndDrop: true,
      autoOpen: 0,
      selectable: true,
      autoEscape: false,
      onCreateLi: function(node, $li) {
        $li.find('.jqtree-title').html(self.treeNodeMenu({model: node}));
      }
    }).bind("tree.move", function(e){
      e.preventDefault();

      if(self.currentActionRequest)
        self.currentActionRequest.remove();

      var view = self.currentActionRequest = new ActionRequest({model: new Backbone.Model(e.move_info)});
      view.on("success", function(topath){
        self.refreshTree();
      });
      self.$(".actionRequest").html(view.render().$el);
    }).bind("tree.click", function(e){
      e.preventDefault();

      if(self.currentActionRequest)
        self.currentActionRequest.remove();

      var view = self.currentActionRequest = new RelatedRequest({model: new Backbone.Model(e.node)});
      self.$(".actionRequest").html(view.render().$el);
    })
    return this;
  }
});
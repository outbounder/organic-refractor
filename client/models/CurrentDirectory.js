var walk = function(root, decorator) {
  if(root.label) {
    root.nodeName = root.label;
    root.label = decorator(root);
  }
  if(root.children)
    for(var i = 0; i<root.children.length; i++)
      walk(root.children[i], decorator);
}
module.exports = Backbone.Model.extend({
  toTreeJSON: function(decorator){
    if(!decorator) return [this.get("entries")];
    walk(this.get("entries"), decorator)
    return [this.get("entries")];
  }
})
module.exports = Backbone.Model.extend({
  toTreeJSON: function(){
    return [this.get("entries")];
  }
})
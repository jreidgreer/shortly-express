Shortly.ActiveUser = Backbone.Model.extend({
  urlRoot: '/me',

  initialize: function() {
    console.log(this.get('urlRoot'));
    console.log(this.url());
  }
});
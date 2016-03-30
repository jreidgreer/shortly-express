Shortly.ActiveUserView = Backbone.View.extend({
  className: 'active-user',

  template: Templates['user-card'],

  initialize: function() {
    this.model.on('change', this.render, this);
  },

  render: function() {
    console.log(this.model);
    this.$el.html(this.template(this.model.attributes));
    return this;
  }
});


import './helpers.js';
import './speakers.js';
import './topics.js';

import './main.html';


FlowRouter.route('/', {
  action: function(params) {
    BlazeLayout.render("layout", {main: "speakers"});
  }
});
FlowRouter.route('/topics', {
  action: function(params) {
    BlazeLayout.render("layout", {main: "topics"});
  }
});
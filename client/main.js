import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { getSpeakers } from '/shared/queries.js';

import './helpers.js';

import './main.html';

Template.speakers.onCreated(function() {
  var instance = this;

  // initialize the reactive variables
  instance.loaded = new ReactiveVar(0);
  instance.search = new ReactiveVar("");
  instance.direction = new ReactiveVar(-1);
  instance.sort = new ReactiveVar("fk");
  instance.limit = new ReactiveVar(1000);

  instance.autorun(function () {
    var subscription = instance.subscribe('speakers', {
    	limit: instance.limit.get(),
    	search: instance.search.get(),
    	direction: instance.direction.get(),
    	sort: instance.sort.get(),
    });

    if (subscription.ready()) {
      instance.loaded.set(instance.limit.get());
    } else {
      // console.log("> Subscription is not ready yet. \n\n");
    }
  });
});

Template.speakers.helpers({
  loaded() {
  	return Template.instance().loaded.get();
  },
  limit() {
  	return Template.instance().limit.get();
  },
  search() {
  	return Template.instance().search.get();
  },
  sort() {
  	return Template.instance().sort.get();
  },
  direction() {
  	return Template.instance().direction.get();
  },
  speakers() {
  	const sort = Template.instance().sort.get();
  	const direction = Template.instance().direction.get();
  	const limit = Template.instance().limit.get();
  	const search = Template.instance().limit.get();

  	// console.log(getSpeakers);
  	return getSpeakers({ sort, direction, limit, search });
  }
});

Template.speakers.events({
  'click .load-more': function(event, instance) {
    event.preventDefault();

    // get current value for limit, i.e. how many posts are currently displayed
    var limit = instance.limit.get();
    limit += 5;
    instance.limit.set(limit);
  }
});

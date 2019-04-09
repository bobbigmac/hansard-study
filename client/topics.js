import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './topics.html';

Template.topics.onCreated(function() {
  var instance = this;

  // initialize the reactive variables
  instance.loading = new ReactiveVar(false);
  instance.party = new ReactiveVar("");
  instance.topics = new ReactiveVar({});

  instance.autorun(function () {
    console.log('Calling get-popular-phrases', instance.party.get());
    instance.loading.set(true);

    Meteor.call('get-popular-phrases', instance.party.get(), (err, res) => {
      console.log('Got popular phrases', err || res);
      instance.topics.set(res);
      instance.loading.set(false);
    });
  });
});

Template.topics.events({
  'click .party-select'(event, instance) {
    // console.log(this);
    instance.party.set(this.name)
  }
});

Template.topics.helpers({
  topics() {
    //{ countedTopics, scoredTopics, pwTopics, pfTopics }
    return Template.instance().topics.get();
  },
  party() {
    return Template.instance().party.get();
  },
  selectedClass() {
    const party = Template.instance().party.get();
    return (this.name === party ? 'selected' : '');
  },
  loadingClass() {
    return Template.instance().loading.get() ? 'loading' : '';
  },
  parties() {
    return [
      { name: '', title: 'None' },
      { name: 'Conservative' },
      { name: 'Labour' },
      { name: 'Scottish National Party' },
      { name: 'Liberal Democrat' },
      { name: 'Independent' },
      { name: 'Democratic Unionist Party' },
      { name: 'Plaid Cymru' },
    ]
  }
});
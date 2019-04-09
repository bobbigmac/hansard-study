import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './topics.html';

const availableKeys = [
  { name: "scoredTopics", title: "By Absolute Uses" }, 
  { name: "pwTopics", title: "By Per-Word Uses" }, 
  { name: "pfTopics", title: "By Per-Fragment Uses" }, 
  { name: "countedTopics", title: "By Relative Uses" },
];

Template.topics.onCreated(function() {
  var instance = this;

  // initialize the reactive variables
  instance.loading = new ReactiveVar(false);
  instance.party = new ReactiveVar("");
  instance.topics = new ReactiveVar({});

  instance.activeKey = new ReactiveVar(availableKeys[0]);

  instance.autorun(function () {
    console.log('Calling get-popular-phrases', instance.party.get());
    instance.loading.set(true);

    Meteor.call('get-popular-phrases', instance.party.get(), (err, res) => {
      Object.keys(res).map(setKey => {
        const wordSet = res[setKey] || [];
        const scoreKey = Object.keys(wordSet[0]).filter(k => k !== 'phrase')[0];
        const total = wordSet.reduce((sum,x) => sum+x[scoreKey], 0);
        // console.log('scoreKey', scoreKey, 'total', total);
        wordSet.map((x,p,a) => {
          a[p].order = p;
          a[p].share = ((x[scoreKey] / total) * 100).toFixed(2);
        });
      });

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
  },
  'click .topic-select'(event, instance) {
    // console.log(this);
    instance.activeKey.set(this)
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
  availableKeys() {
    return availableKeys;
  },
  activeKey() {
    return Template.instance().activeKey.get();
  },
  activeSet() {
    const key = Template.instance().activeKey.get();
    const topics = Template.instance().topics.get() || {};

    // console.log(topics);
    return topics[key.name];
  },
  cssOrder() {
    return "order: " + this.order + ";font-size:" + (this.share * 40) + 'px;';
  },
  selectedClass() {
    const party = Template.instance().party.get();
    const key = Template.instance().activeKey.get().name;
    if(this.name === party) {
      return 'selected';
    }
    if(this.name === key) {
      return 'selected';
    }
  },
  loadingClass() {
    return Template.instance().loading.get() ? 'loading' : '';
  },
  parties() {
    return [
      { name: '', title: 'All Parties' },
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
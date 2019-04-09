import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { getSpeakers } from '/shared/queries.js';

import './speakers.html';

Template.speakers.onCreated(function() {
  var instance = this;

  // initialize the reactive variables
  instance.loaded = new ReactiveVar(0);
  instance.search = new ReactiveVar("");
  instance.direction = new ReactiveVar(-1);
  instance.sort = new ReactiveVar("fk");
  instance.limit = new ReactiveVar(1000);

  instance.autorun(function () {
    // instance.loaded.set(0);

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
  },
  parties() {
    const sort = Template.instance().sort.get();
    const direction = Template.instance().direction.get();
    const limit = Template.instance().limit.get();
    const search = Template.instance().limit.get();

    // console.log(getSpeakers);
    const fragments = {};
    const words = {};

    const speakers = getSpeakers({ sort, direction, limit, search }).fetch();
    const parties = speakers.reduce((pre, speaker) => {
      const party = (speaker.party || '').replace(' (Co-op)', '').trim();
      if(party && party !== 'Speaker') {
        pre[party] = pre[party] || 0;
        pre[party]++;

        fragments[party] = fragments[party] || 0;
        fragments[party] += (speaker.counts && speaker.counts.fragments);

        words[party] = words[party] || 0;
        words[party] += (speaker.counts && speaker.counts.words);
      }
      return pre;
    }, {});

    const totalPartyCount = Object.keys(parties).reduce((p,k) => p + parties[k], 0);
    const totalWordCount = Object.keys(parties).reduce((p,k) => p + words[k], 0);
    const avgWordCount = totalWordCount / totalPartyCount;
    const totalFragmentCount = Object.keys(parties).reduce((p,k) => p + fragments[k], 0);
    const avgFragmentCount = totalFragmentCount / totalPartyCount;

    // const partyShares = {};
    const wordShares = {};
    const fragmentShares = {};
    Object.keys(parties).map(party => {
      // partyShares[party] = parties[party] / totalPartyCount;
      wordShares[party] = words[party] / avgWordCount;
      fragmentShares[party] = fragments[party] / avgFragmentCount;
    });

    const partyArray = Object.entries(parties).map(([key, value]) => ({
      name: key, 
      count: value, 
      words: words[key], 
      fragments: fragments[key],
      // partyShare: partyShares[key],
      wordShare: wordShares[key],
      fragmentShare: fragmentShares[key],
    }));
    partyArray.sort((a,b) => a.count > b.count ? -1 : 1);

    // console.log(partyArray);
    return partyArray;
  }
});

Template.speakers.events({
  'click th[data-sort]': function(event, instance) {
    const sort = Template.instance().sort.get();
    const direction = Template.instance().direction.get();

    const newSort = event.target.dataset && event.target.dataset.sort;
    if(newSort === sort) {
      Template.instance().direction.set(Template.instance().direction.get() * -1);
    } else {
      Template.instance().sort.set(newSort);
    }
    // console.log('newSort', newSort);
  },
  'click .load-more': function(event, instance) {
    event.preventDefault();

    // get current value for limit, i.e. how many posts are currently displayed
    var limit = instance.limit.get();
    limit += 5;
    instance.limit.set(limit);
  }
});

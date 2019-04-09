import { Meteor } from 'meteor/meteor';
import { Bills, ResourceFiles } from '/shared/model.js';

import Publish from '/server/publish.js';

import Scrape from '/server/scrape.js';
import ProcessText from '/server/process-text.js';
import ProcessSpeakers from '/server/process-speakers.js';

const request = require('request');
const xml2js = require('xml2js');
const crypto = require('crypto');


Meteor.startup(() => {
	const logIt = true;
	// code to run on server at startup
	Scrape.scrape(logIt);
	ProcessText.process(logIt);
	ProcessSpeakers.process(logIt);

	Publish();
});


Meteor.methods({
	'get-popular-words': function(party = '') {
		const filter = {
			terms: {$exists:true},
		};
		if(party && typeof party === 'string') {
			if(party === 'Labour') {
				filter.party = { '$in': ['Labour', 'Labour (Co-op)'] }
			} else {
				filter.party = party;
			}
		}
		let topics = Speakers.find(filter, {
			fields: { party: 1, 'terms.words': 1, 'terms.wordsHash': 1 }
		}).fetch().reduce((pre, s) => {
			Object.keys(s.terms.wordsHash).map(wordKey => {
				pre[wordKey] = pre[wordKey] || {};
				
				pre[wordKey].word = pre[wordKey].word || s.terms.wordsHash[wordKey].word;

				pre[wordKey].score = pre[wordKey].score || 0;
				pre[wordKey].score += s.terms.wordsHash[wordKey].score;

				pre[wordKey].count = pre[wordKey].count || 0;
				pre[wordKey].count += 1;

				if(s.terms.wordsHash[wordKey].pw) {
					// pre[wordKey].pws = (pre[wordKey].pws || []).concat([s.terms.wordsHash[wordKey].pw]);
					pre[wordKey].pw = pre[wordKey].pw || 0;
					pre[wordKey].pw += s.terms.wordsHash[wordKey].pw;
				}
				if(s.terms.wordsHash[wordKey].pf) {
					// pre[wordKey].pfs = (pre[wordKey].pfs || []).concat([s.terms.wordsHash[wordKey].pf]);
					pre[wordKey].pf = pre[wordKey].pf || 0;
					pre[wordKey].pf += s.terms.wordsHash[wordKey].pf;
				}
			});
			
			return pre;
		}, {});

		// console.log('Starting remap');

		topics = Object.entries(topics).map(x => ({
			word: x[1].word, 
			score: x[1].score,
			count: x[1].count,
			// pw: x[1].pws.reduce((sum,x) => x + sum, 0) / x[1].pws.length,
			pw: x[1].pw,
			// pf: x[1].pfs.reduce((sum,x) => x + sum, 0) / x[1].pfs.length,
			pf: x[1].pf,
		})).filter(x => x.count > 2);

		// console.log('Starting sort', topics.length);
		
		// const countedTopics = topics.sort((a,b) => console.log(a, b) || (a.count > b.count ? -1 : 1))
		const countedTopics = topics.sort((a,b) => a.count > b.count ? -1 : 1)
													// .map(x => x.word)
													.slice(0, 100);

		const scoredTopics = topics.sort((a,b) => a.score > b.score ? -1 : 1)
													// .map(x => x.word)
													.slice(0, 100);

		const pwTopics = topics.sort((a,b) => a.pw > b.pw ? -1 : 1)
											// .map(x => x.word)
											.slice(0, 100);

		const pfTopics = topics.sort((a,b) => a.pf > b.pf ? -1 : 1)
											// .map(x => x.word)
											.slice(0, 100);

		return { countedTopics, scoredTopics, pwTopics, pfTopics };
	},
	'get-popular-phrases': function(party = '') {
		const filter = {
			terms: {$exists:true},
		};
		if(party && typeof party === 'string') {
			filter.party = party;
		}
		let topics = Speakers.find(filter, {
			fields: { party: 1, 'terms.phrases': 1, 'terms.phrasesHash': 1 }
		}).fetch().reduce((pre, s) => {
			Object.keys(s.terms.phrasesHash).map(phraseKey => {
				pre[phraseKey] = pre[phraseKey] || {};
				
				pre[phraseKey].phrase = pre[phraseKey].phrase || s.terms.phrasesHash[phraseKey].phrase;

				pre[phraseKey].score = pre[phraseKey].score || 0;
				pre[phraseKey].score += s.terms.phrasesHash[phraseKey].score;

				pre[phraseKey].count = pre[phraseKey].count || 0;
				pre[phraseKey].count += 1;

				if(s.terms.phrasesHash[phraseKey].pw) {
					// pre[phraseKey].pws = (pre[phraseKey].pws || []).concat([s.terms.phrasesHash[phraseKey].pw]);
					pre[phraseKey].pw = pre[phraseKey].pw || 0;
					pre[phraseKey].pw += s.terms.phrasesHash[phraseKey].pw;
				}
				if(s.terms.phrasesHash[phraseKey].pf) {
					// pre[phraseKey].pfs = (pre[phraseKey].pfs || []).concat([s.terms.phrasesHash[phraseKey].pf]);
					pre[phraseKey].pf = pre[phraseKey].pf || 0;
					pre[phraseKey].pf += s.terms.phrasesHash[phraseKey].pf;
				}
			});
			
			return pre;
		}, {});

		// console.log('Starting remap');

		topics = Object.entries(topics).map(x => ({
			phrase: x[1].phrase, 
			score: x[1].score,
			count: x[1].count,
			// pw: x[1].pws.reduce((sum,x) => x + sum, 0) / x[1].pws.length,
			pw: x[1].pw,
			// pf: x[1].pfs.reduce((sum,x) => x + sum, 0) / x[1].pfs.length,
			pf: x[1].pf,
		})).filter(x => x.count > 2);

		// console.log('Starting sort', topics.length);
		
		// const countedTopics = topics.sort((a,b) => console.log(a, b) || (a.count > b.count ? -1 : 1))
		const countedTopics = topics.sort((a,b) => a.count > b.count ? -1 : 1)
													// .map(x => x.phrase)
													.slice(0, 100);

		const scoredTopics = topics.sort((a,b) => a.score > b.score ? -1 : 1)
													// .map(x => x.phrase)
													.slice(0, 100);

		const pwTopics = topics.sort((a,b) => a.pw > b.pw ? -1 : 1)
											// .map(x => x.phrase)
											.slice(0, 100);

		const pfTopics = topics.sort((a,b) => a.pf > b.pf ? -1 : 1)
											// .map(x => x.phrase)
											.slice(0, 100);

		return { countedTopics, scoredTopics, pwTopics, pfTopics };
	},
	'get-resource-files': function() {
		const resourcesUrl = 'http://api.data.parliament.uk/resources/files/feed?dataset=12&take=all';

		const addResource = Meteor.bindEnvironment(function(entry) {
			const _id = entry._id;
			delete entry._id;

			ResourceFiles.upsert({ _id: _id }, {
				$set: entry
			});
		});

		request(resourcesUrl, (error, response, body) => {
			if (error || response.statusCode != "200") {
				console.error('Could not request', resourcesUrl);
				return;
			}

			// console.log(body);

      var parser = new xml2js.Parser();
      parser.parseString(body, function (err, result) {
      	// console.log('Got resources', result.feed.entry);
      	result.feed.entry.forEach(entry => {
      		// console.log(entry, 'before');
      		if(entry.id && entry.id.length === 1) {
      			entry.id = entry.id[0];
      		}

      		if(entry.link && entry.link.length === 1) {
      			entry.link = entry.link[0];
      		}
      		entry.link = ((entry.link.$ && entry.link.$.href) || entry.link)

      		if(entry.title && entry.title.length === 1) {
      			entry.title = entry.title[0];
      		}
      		entry.title = ((entry.title.$ && entry.title._) || entry.title);

      		if(entry.author && entry.author.length === 1) {
      			entry.author = entry.author[0];
      		}
      		entry.author = ((entry.author && entry.author.name) || entry.author);

      		if(entry.updated && entry.updated.length === 1) {
      			entry.updated = entry.updated[0];
      		}

      		entry._id = crypto.createHash('sha1').update(entry.id).digest("hex");
      		
      		console.log(entry);

      		addResource(entry);
      	});
      });
		});
	},
	/*'get-bills': function() {
		var parliament = require('psuk-parliament');
		console.log(parliament);
		
		// // Get Summary information for all Bills
		// parliament.bills.getBills()
		// .then(function(bills) {
		//     bills.forEach(function(bill, index, array) {
		//         console.log( util.inspect( bill ) );
		//     });
		// });
		//
		// // Get Full information for a single Bill
		// parliament.bills.getBills()
		// .then(function(bills) {
		//     // Get full data for a single Bill (slow)
		//     var bill = bills[0];
		//     bill.getFullBill()
		//     .then(function(bill) {
		//         console.log( util.inspect( bill ) );
		//     });
		// });

		// Get Full information for all Bills
		// Note: SLOW!
		parliament.bills.getFullBills()
			.then(Meteor.bindEnvironment(function(bills) {
				bills.forEach(Meteor.bindEnvironment(function(bill, index, array) {
					console.log(bill);
					Bills.insert(bill);
				}));
			}))
			.catch(function(err) {
				console.error(err);
			});
	}*/
});

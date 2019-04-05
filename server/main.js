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
	const logIt = false;
	// code to run on server at startup
	Scrape.scrape(logIt);
	ProcessText.process(logIt);
	ProcessSpeakers.process(logIt);

	Publish();
});


Meteor.methods({
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

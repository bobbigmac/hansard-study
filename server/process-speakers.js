import { Meteor } from 'meteor/meteor';
// import { _ } from 'meteor/underscore';

import { Fragments, Speakers } from '/shared/model.js';

const request = require('request');

const newAverage = function(newEntry, existingEntries) {
	const newArray = [newEntry].concat(existingEntries);
	const sum = newArray.reduce((pre, val) => {
		return pre + val;
	}, 0);
	return sum / newArray.length;
}
const average = function(entries = []) {
	const sum = entries.reduce((pre, val) => {
		return pre + val;
	}, 0);
	return sum / entries.length;
}
const averageKeys = function(obj1, obj2) {
	return Object.keys(obj1).reduce((pre, key) => {
		pre[key] = (obj1[key] + obj2[key]) / 2;
		return pre;
	}, {});
}

const process = function(logIt) {
	// return false;
	// Speakers.find({
	// 	'pwcounts.wpf': {$exists: false}
	// 	// counts: {$exists: true}
	// }, {
	// 	// limit: 1,//TODO: Remove
	// 	fields: {counts:1},
	// }).fetch().map(s => {
	// 	const totalWordCount = ((s && s.counts && s.counts.words) || 0);
	// 	const totalFragCount = 1 + ((s && s.counts && s.counts.fragments) || 0);
		
	// 	const updateFields = {};

	// 	updateFields['pwcounts.wpf'] = totalWordCount / totalFragCount;
	// 	let added = 1;
	// 	Object.keys(s.counts).map(xKey => {
	// 		Object.keys(s.counts[xKey]).map(yKey => {
	// 			const usingTotal = (xKey === 'retext-readability' ? totalFragCount : totalWordCount);
				
	// 			const countsKey = ['counts', xKey||'unknown', (yKey||'unknown').replace(/\./g, '-')].join('.');

	// 			const perWordCountsKey = ['pwcounts', xKey||'unknown', (yKey||'unknown').replace(/\./g, '-')].join('.');
	// 			const currentCount = (s ? countsKey.split('.').reduce((o,i) => o && o[i], s) || 0 : 0);

	// 			updateFields[perWordCountsKey] = (currentCount / usingTotal) * 100;
	// 			added++;
	// 		});
	// 	});

	// 	if(added) {
	// 		console.log('Want to set on speaker:', s._id, updateFields);
	// 		Speakers.update(s._id, {
	// 			$set: updateFields
	// 		})
	// 	}
	// });
	// return false;


	Speakers.find({
		'terms': { $exists: false },
		'counts.words': { $gt: 0 },
		'counts.fragments': { $gt: 0 },
	}, {
		limit: 1,
		// skip: 100,
		fields: {
			cts: true,
			mnisIds: true,
			pimsId: true,
			counts: 1,
		}
	}).observeChanges({
		added: function (id, speaker) {
			const allFragments = Fragments.find({
				$or: [
					{ 'speaker.id': id },
					{ 'speaker.pimsId': speaker.pimsId },
					{ 'speaker.mnisId': (speaker.mnisIds && speaker.mnisIds[0]) || 0 },
				]
			}, {
				fields: {
					terms: 1,
				}
			}).fetch();
			console.log('Want terms for speaker', speaker.cts, allFragments.length);

			const terms = allFragments.reduce((pre, fragment) => {
				if(fragment.terms) {
					(fragment.terms.words || []).map(x => {
						pre.words[x.word] = pre.words[x.word] || 0;
						pre.words[x.word] += x.score;
					});
					(fragment.terms.phrases || []).map(x => {
						pre.phrases[x.phrase] = pre.phrases[x.phrase] || 0;
						pre.phrases[x.phrase] += x.score;
					});
				}
				return pre;
			}, {
				words: {},
				phrases: {},
			});

			terms.words = Object.entries(terms.words).map(x => ({
				word: x[0], 
				score: x[1],
				pw: x[1] / speaker.counts.words,
				pf: x[1] / speaker.counts.fragments,
			}));
			terms.phrases = Object.entries(terms.phrases).map(x => ({
				phrase: x[0], 
				score: x[1],
				pw: x[1] / speaker.counts.words,
				pf: x[1] / speaker.counts.fragments,
			}));

			const numItems = 1000;
			const topItems = 50;

			terms.words.sort((a,b) => a.score > b.score ? -1 : 1);
			terms.words = terms.words.slice(0,numItems);
			terms.phrases.sort((a,b) => a.score > b.score ? -1 : 1);
			terms.phrases = terms.phrases.slice(0,numItems);

			terms.topWords = terms.words.slice(0, topItems).map(x => x.word);
			// terms.bottomWords = terms.words.slice(Math.max(terms.words.length - topItems, 1)).reverse();
			terms.topPhrases = terms.phrases.slice(0, topItems).map(x => x.phrase);
			// terms.bottomPhrases = terms.phrases.slice(Math.max(terms.phrases.length - topItems, 1)).reverse();

			terms.wordsHash = terms.words.reduce((pre, x) => {
				const wordKey = x.word.toLowerCase().replace(/[\.]/g, '-').replace(/[\$]/g, '_');
				pre[wordKey] = {
					score: x.score,
					word: x.word,
					pw: x.pw,
					pf: x.pf,
				};
				return pre;
			}, {});
			terms.phrasesHash = terms.phrases.reduce((pre, x) => {
				const wordKey = x.phrase.toLowerCase().replace(/[\.]/g, '-').replace(/[\$]/g, '_');
				pre[wordKey] = {
					score: x.score,
					phrase: x.phrase,
					pw: x.pw,
					pf: x.pf,
				};
				return pre;
			}, {});

			terms.words = terms.words.map(w => w.word);
			terms.phrases = terms.phrases.map(w => w.phrase);
			
			// console.log(terms.words);
			Speakers.update(id, {
				$set: { terms }
			});
			console.log('Saved words', terms.words.length, 'phrases', terms.phrases.length, 'to speaker', speaker.cts);//, terms);
		}
	});

	// Calc pw averages
	Speakers.find({
		'pwcounts.averages': { $exists: false },
		'pwcounts': { $exists: true },
	}, {
		limit: 1,
		fields: { pwcounts: true }
	}).observeChanges({
		added: function (id, speaker) {
			const intensify = speaker.pwcounts['retext-intensify'];
			const intensifyKeys = Object.keys(intensify || {});
			const intensifySum = intensifyKeys.reduce((s, x) => s + intensify[x], 0);
			const intensifyAvg = (intensifySum / intensifyKeys.length);

			const passive = speaker.pwcounts['retext-passive'];
			const passiveKeys = Object.keys(passive || {});
			const passiveSum = passiveKeys.reduce((s, x) => s + passive[x], 0);
			const passiveAvg = (passiveSum / passiveKeys.length);

			const simplify = speaker.pwcounts['retext-simplify'];
			const simplifyKeys = Object.keys(simplify || {});
			const simplifySum = simplifyKeys.reduce((s, x) => s + simplify[x], 0);
			const simplifyAvg = (simplifySum / simplifyKeys.length);
			
			const totalSum = (intensifySum + passiveSum + simplifySum);

			const averages = {
				intensifysum: intensifySum,
				passivesum: passiveSum,
				simplifysum: simplifySum,
				
				intensify: intensifyAvg,
				passive: passiveAvg,
				simplify: simplifyAvg,

				totalsum: totalSum,
				totalavg: totalSum / 3,
			};

			Speakers.update(id, {$set: { 'pwcounts.averages': averages }});
		}
	});

	// Get profiles
	Speakers.find({
		'mnisIds': { $exists: true },
		'profile': { $exists: false },
	}, {
		limit: 1,
	}).observeChanges({
		added: function (id, speaker) {
			const url = 'http://lda.data.parliament.uk/members/' + speaker.mnisIds[0] + '.json';

			request(url, Meteor.bindEnvironment(function(err, res, content) {
				err && console.error(err);
				if(!err) {
					const profile = {};
					let result = null;

					try {
						const resultObj = JSON.parse(content || '{}');
						result = resultObj && resultObj.result;
					} catch(err) {
						console.warn('Could not parse for', speaker.mnisIds[0]);
						// result = {};
					}

					const update = {
						$set: {
							profile: result,
							party: result && result.primaryTopic && result.primaryTopic.party && result.primaryTopic.party._value,
							twitter: result && result.primaryTopic && result.primaryTopic.twitter && result.primaryTopic.twitter._value,
						}
					};
					// console.log(update);
					Speakers.update(id, update);

					logIt && console.log('Got content for mnisId', speaker.mnisIds[0], typeof content, result);
				}
			}));
		}
	});

	const cursor = Fragments.find({
		'speaker': { $exists: true },
		'speaker.pimsId': { $exists: true },
		'speaker.imported': { $exists: false },
		'stats': { $exists: true, $ne: null },
		'terms': { $exists: true, $ne: null },
		'stats.optimism': { $exists: true },
		'stats.wellbeing': { $exists: true },
	}, {
		// limit: 259999,
		limit: 1,
		// skip:0,
		fields: {
			speaker: 1,
			stats: 1,
			retext: 1,
			terms: 1,
		}
	// }).fetch().map(Meteor.bindEnvironment(function(fragment) {
	// 	const id = fragment._id;
	// 	delete fragment._id;
	});

	// console.log(cursor.count(), 'fragments to process speakers for');

	cursor.observeChanges({
		added: function (id, fragment) {
			logIt && console.log('Processing frament speaker for', id);
			const existingSpeaker = Speakers.findOne({
				pimsId: fragment.speaker.pimsId 
			}, {
				fields:{
					_id: 1,
					wellbeing:1,cts:1,fks:1,sentiments:1,optimisms:1,intensities:1,affects:1,
					counts: 1,
				}
			});

			const newWellbeing = fragment.stats && fragment.stats.wellbeing;
			const oldWellbeing = existingSpeaker && existingSpeaker.wellbeing;
			const wellbeing = oldWellbeing ? averageKeys(oldWellbeing, newWellbeing) : newWellbeing;
			const update = {
				$set: {
					pimsId: fragment.speaker.pimsId,
					wellbeing: wellbeing,
				}
			};

			if(fragment.stats && fragment.stats.fk) {
				update['$set'].fk = newAverage(fragment.stats.fk, (existingSpeaker && existingSpeaker.fks) || []);
			}
			if(fragment.stats && fragment.stats.sentiment) {
				update['$set'].sentiment = newAverage(fragment.stats.sentiment, (existingSpeaker && existingSpeaker.sentiments) || []);
			}
			if(fragment.stats && fragment.stats.optimism) {
				update['$set'].optimism = newAverage(fragment.stats.optimism, (existingSpeaker && existingSpeaker.optimisms) || []);
			}
			if(fragment.stats && fragment.stats.affect) {
				update['$set'].affect = newAverage(fragment.stats.affect, (existingSpeaker && existingSpeaker.affects) || []);
			}
			if(fragment.stats && fragment.stats.intensity) {
				update['$set'].intensity = newAverage(fragment.stats.intensity, (existingSpeaker && existingSpeaker.intensities) || []);
			}

			if(fragment.speaker.mnisId) {
				update['$addToSet'] = update['$addToSet'] || {};
				update['$addToSet'].mnisIds = fragment.speaker.mnisId;
			}

			if(fragment.speaker.name) {
				update['$addToSet'] = update['$addToSet'] || {};
				update['$addToSet'].names = fragment.speaker.name;
			}

			if(fragment.speaker.ct) {
				update['$addToSet'] = update['$addToSet'] || {};
				update['$addToSet'].cts = fragment.speaker.ct;
			}

			update['$inc'] = {
				'counts.fragments': 1,
				'counts.words': fragment.stats.words,
				'counts.sentences': fragment.stats.sentences,
				'counts.syllables': fragment.stats.syllables,
			}

			// fragment.terms && fragment.terms.words && fragment.terms.words.forEach(word => {
			// 	update['$inc']['words.'+word.word.replace(/\./g, '-')] = word.score;
			// });
			// fragment.terms && fragment.terms.phrases && fragment.terms.phrases.forEach(phrase => {
			// 	update['$inc']['phrases.'+phrase.phrase.replace(/\./g, '-')] = phrase.score;
			// });
			
			update['$push'] = {
				fks: fragment.stats.fk,
				sentiments: fragment.stats.sentiment,
				optimisms: fragment.stats.optimism,
				affects: fragment.stats.affect,
				intensities: fragment.stats.intensity,
			}

			const totalWordCount = (fragment.stats.words || 0) + ((existingSpeaker && existingSpeaker.counts && existingSpeaker.counts.words) || 0);
			const totalFragCount = 1 + ((existingSpeaker && existingSpeaker.counts && existingSpeaker.counts.fragments) || 0);
			
			update['$set']['pwcounts.wpf'] = totalWordCount / totalFragCount;

			fragment.retext && fragment.retext.messages && 
			fragment.retext.messages.forEach(y => {
				// const messageKey = ['messages', y.source||'unknown', (y.rule||'unknown').replace(/\./g, '-')].join('.');
				// update['$push'][messageKey] = y.text;
				const countsKey = ['counts', y.source||'unknown', (y.rule||'unknown').replace(/\./g, '-')].join('.');
				update['$inc'][countsKey] = 1;

				const perWordCountsKey = ['pwcounts', y.source||'unknown', (y.rule||'unknown').replace(/\./g, '-')].join('.');
				const currentCount = (existingSpeaker ? countsKey.split('.').reduce((o,i) => o && o[i], existingSpeaker) || 0 : 0) + 1;

				// console.log(perWordCountsKey, currentCount, totalWordCount, 'currentCount / totalWordCount', (currentCount / totalWordCount) * 100);
				const usingTotal = (y.source === 'retext-readability' ? totalFragCount : totalWordCount);
				update['$set'][perWordCountsKey] = (currentCount / usingTotal) * 100;
				//TODO: Will probably need to calc pwcounts specifically for Speakers who were processed early
			})

			const res = Speakers.upsert({
				pimsId: fragment.speaker.pimsId
			}, update);

			const speakerId = ((res && res.insertedId) || (existingSpeaker && existingSpeaker._id));
			if(res && speakerId) {
				Fragments.update(id, {
					$set:{
						'speaker.id': speakerId, 
						'speaker.imported': true
					}
				})
			}
			
			// console.log('Update is', update, 'for pims', fragment.speaker.pimsId);
			logIt && console.log('Updated pims', fragment.speaker.pimsId, 'speakerId', speakerId, existingSpeaker && existingSpeaker.cts && existingSpeaker.cts[0]);
		}
	});
	// }))
}

export default {
	process
}
import { Meteor } from 'meteor/meteor';
import { Fragments, Speakers } from '/shared/model.js';


const averageKeys = function(obj1, obj2) {
	return Object.keys(obj1).reduce((pre, key) => {
		pre[key] = (obj1[key] + obj2[key]) / 2;
		return pre;
	}, {});
}

const process = function() {
	// return false;

	Fragments.find({
		'speaker': { $exists: true },
		'speaker.pimsId': { $exists: true },
		'speaker.imported': { $exists: false },
		'stats': { $exists: true, $ne: null },
		'terms': { $exists: true, $ne: null },
		'stats.optimism': { $exists: true },
		'stats.wellbeing': { $exists: true },
	}, {
		limit: 1,
		// skip:0,
		fields: {
			speaker: 1,
			stats: 1,
			retext: 1,
			terms: 1,
		}
	}).observeChanges({
		added: function (id, fragment) {
			const existingSpeaker = Speakers.findOne({
				pimsId: fragment.speaker.pimsId 
			}, {
				fields:{_id: 1,wellbeing:1,cts:1}
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

			if(fragment.speaker.mnsId) {
				update['$addToSet'] = update['$addToSet'] || {};
				update['$addToSet'].mnsIds = fragment.speaker.mnsId;
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

			fragment.terms && fragment.terms.words && fragment.terms.words.forEach(word => {
				update['$inc']['words.'+word.word.replace(/\./g, '-')] = word.score;
			});
			fragment.terms && fragment.terms.phrases && fragment.terms.phrases.forEach(phrase => {
				update['$inc']['phrases.'+phrase.phrase.replace(/\./g, '-')] = phrase.score;
			});
			
			update['$push'] = {
				fks: fragment.stats.fk,
				sentiments: fragment.stats.sentiment,
				optimisms: fragment.stats.optimism,
				affects: fragment.stats.affect,
				intensities: fragment.stats.intensity,
			}
			
			fragment.retext && fragment.retext.messages && 
			fragment.retext.messages.forEach(y => {
				const messageKey = ['messages', y.source||'unknown', (y.rule||'unknown').replace(/\./g, '-')].join('.');
				update['$push'][messageKey] = y.text;
				const countsKey = ['counts', y.source||'unknown', (y.rule||'unknown').replace(/\./g, '-')].join('.');
				update['$inc'][countsKey] = 1;
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
			console.log('Updated pims', fragment.speaker.pimsId, 'speakerId', speakerId, existingSpeaker && existingSpeaker.cts && existingSpeaker.cts[0]);
		}
	});
}

export default {
	process
}
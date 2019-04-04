import { Meteor } from 'meteor/meteor';
import { Fragments } from '/shared/model.js';

var natural = require('natural');
var wordTokenizer = new natural.WordTokenizer();
var sentenceTokenizer = new natural.SentenceTokenizer();

var fleschKincaid = require('flesch-kincaid')
var syllable = require('syllable')
var wordcount = require('wordcount')

var Analyzer = require('natural').SentimentAnalyzer;
var stemmer = require('natural').PorterStemmer;
var analyzer = new Analyzer("English", stemmer, "afinn");

var unified = require('unified')
var english = require('retext-english')
var stringify = require('retext-stringify')
var readability = require('retext-readability')
var simplify = require('retext-simplify')
var passive = require('retext-passive')
var intensify = require('retext-intensify')
var profanities = require('retext-profanities')


const measureString = function(str, cb) {
	unified()
	  .use(english)
	  .use(readability, {age:16})
		.use(simplify)
		.use(passive)
		.use(intensify)
		// .use(profanities)
	  .use(stringify)
	  .process(str, cb)
}


const process = function() {
	Fragments.find({
		stats: {
			$exists: false
		}
	}, {
		limit: 2,
		// skip:1,
	}).observeChanges({
		added: function (id, fragment) {
			fragment.text = fragment.text.replace(/\r\n/g, ' ').replace(/\s+/g, ' ').replace(/hon\./g, 'honorable').trim();
			
			// console.log('Will analyse fragment', id, fragment.text);
			measureString(fragment.text, Meteor.bindEnvironment((err, response) => {
				// console.log(err, fragment.text, response);
				const messages = response && response.messages.map(x => {
					return {
						text: x.toString(),
						rule: x.ruleId,
						source: x.source,
					}
				});

				let newData = {
					retext: {
						messages,
						data: response.data,
					},
					stats: null
				};
				
				try {
					const syllCount = syllable(fragment.text);
					const words = wordTokenizer.tokenize(fragment.text);
					const sentences = sentenceTokenizer.tokenize(fragment.text);

					const sentiment = analyzer.getSentiment(words);

					newData.stats = {
						words: words.length,
						sentences: sentences.length,
						syllables: syllCount,
						fk: fleschKincaid({
							word: words.length,
							sentence: sentences.length,
							syllable: syllCount,
						}),
						sentiment,
					}
				} catch(exc) {
					// Do nothing
					console.warn('Could not parse text correctly for stats on', fragment.text);
				}

				// console.log('newData', newData);
				Fragments.update({_id: id}, {
					$set: newData
				});

				console.log('Analysed fragment', id, newData.stats && newData.stats.fk);
			}));
		}
	});
}

export default {
	process
}
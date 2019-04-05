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

var keywords = require('retext-keywords')
var toString = require('nlcst-to-string')

const optimismo = require('optimismo')
const affectimo = require('affectimo')
const wba = require('wellbeing_analysis');


const extractTerms = function(str, cb) {
	unified()
	  .use(english)
	  .use(keywords)
	  .use(stringify)
	  .process(str, (err, res) => {
	    function stringify(value) {
	      return toString(value)
	    }
  		// console.log(res.data.keywords);
	  	const terms = !err ? {
			  words: res.data.keywords.map(function(keyword) {
	  	    return {
	  	    	word: toString(keyword.matches[0].node),
	  	    	score: keyword.score,
	  	    }
			  }),
			  phrases: res.data.keyphrases.map(function(phrase) {
			    return {
			    	phrase: phrase.matches[0].nodes.map(stringify).join(''),
			    	score: phrase.score
			    }
			  }),
			} : null;
	  	cb && cb(err, terms);
	  })
}

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
	//Extract terms addition
	Fragments.find({
		'text': { $exists: true },
		'terms': { $exists: false },
	}, {
		limit: 1,
		fields: {text: 1}
		// skip:1,
	}).observeChanges({
		added: function (id, fragment) {
			extractTerms(fragment.text, (error, terms) => {
				Fragments.update(id, {
					$set: { terms: terms || {} }
				});
				
				console.log('Got terms', id, terms.words && terms.words.length, terms.phrases && terms.phrases.length);
			});
		}
	})

	//Optimism addition
	Fragments.find({
		'stats.optimism': { $exists: false },
		'stats': { $exists: true, $ne: null },
	}, {
		limit: 1,
		fields: {text: 1}
		// skip:1,
	}).observeChanges({
		added: function (id, fragment) {
			const optimism = optimismo(fragment.text, { locale: 'GB' });
			const affect = affectimo(fragment.text, { locale: 'GB' });
			const wellbeing = wba(fragment.text, { locale: 'GB' });

			Fragments.update(id, {
				$set: {
					'stats.optimism': (optimism && optimism.OPTIMISM) || null,
					'stats.affect': (affect && affect.AFFECT) || null,
					'stats.intensity': (affect && affect.INTENSITY) || null,
					'stats.wellbeing': wellbeing,
				}
			});
			
			console.log('Set optimism, affect and wellbeing for Fragment', id, optimism && optimism.OPTIMISM);
		}
	})

	// MAIN STATS
	Fragments.find({
		stats: {
			$exists: false
		}
	}, {
		limit: 20,
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

					const optimism = optimismo(fragment.text, { locale: 'GB' });
					const affect = affectimo(fragment.text, { locale: 'GB' });
					const wellbeing = wba(fragment.text, { locale: 'GB' });
					// console.log('optimism', optimism);

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
						optimism: (optimism && optimism.OPTIMISM) || null,
						affect: (affect && affect.AFFECT) || null,
						intensity: (affect && affect.INTENSITY) || null,
						wellbeing,
					}
				} catch(exc) {
					// Do nothing
					console.warn('Could not parse text correctly for stats on', fragment.text);
				}

				// console.log('newData', newData);
				// Fragments.update({_id: id}, {
				// 	$set: newData
				// });

				console.log('Analysed fragment', id);
			}));
		}
	});
}

export default {
	process
}
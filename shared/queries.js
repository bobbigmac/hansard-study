import { Meteor } from 'meteor/meteor'
import { Speakers } from '/shared/model.js';

const maxSpeakersLimit = 100;

export const getSpeakers = function({ search = '', limit = 10, sort = '', direction = 1}) {
	const filter = {}, options = {};

	if(sort) {
		options.sort = {
			[sort]: direction
		};
		// filter[sort] = {'$exists':true};
	}
	options.limit = limit > maxSpeakersLimit ? maxSpeakersLimit : limit;

	//TODO: Allow server to get more fields
	// options.fields = {
	// 	party: 1,
	// 	mnisIds: 1,
	// 	pimsId: 1,
	// 	cts: 1,
	// 	counts: 1,
	// 	fk: 1,
	// 	fks: 1,
	// 	names: 1,
	// 	profile: 1,
	// 	twitter: 1,
	// }

	if(search) {
		//TODO: Text search on names/cts/profile.fullName
		// options.names = search;
	}

	filter['counts.fragments'] = {$gt:1};
	filter.fk = {$gt:4};

	return Speakers.find(filter, options);
}
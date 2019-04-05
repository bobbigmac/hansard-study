import { Meteor } from 'meteor/meteor'
import { Speakers } from '/shared/model.js';

export const getSpeakers = function({ search = '', limit = 10, sort = '', direction = 1}) {
	const filter = {}, options = {};

	if(sort) {
		options.sort = {
			[sort]: direction
		}
	}
	options.limit = limit > 100 ? 100 : limit;

	//TODO: Allow server to get more fields
	options.fields = {
		party: 1,
		mnisIds: 1,
		pimsId: 1,
		cts: 1,
		names: 1,
		profile: 1,
		twitter: 1,
	}

	if(search) {
		//TODO: Text search on names/cts/profile.fullName
		// options.names = search;
	}

	return Speakers.find(filter, options);
}
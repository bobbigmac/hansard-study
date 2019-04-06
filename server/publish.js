import { Meteor } from 'meteor/meteor'
import { Fragments, Speakers } from '/shared/model.js';
import { getSpeakers } from '/shared/queries.js';

const publish = function() {
	Meteor.publish("speakers", getSpeakers)
	
	//TODO:Meteor.publish("speaker", getSpeaker)
}

export default publish;
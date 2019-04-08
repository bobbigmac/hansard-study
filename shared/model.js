const Bills = new Mongo.Collection('bills');
const ResourceFiles = new Mongo.Collection('resource-files');
const Files = new Mongo.Collection('files');

const Speakers = new Mongo.Collection('speakers');
if(Meteor.isServer) {
	Speakers._ensureIndex({
		pimsId: 1
	})
	Speakers._ensureIndex({
		fk: 1
	})
	Speakers._ensureIndex({
		'counts.fragments': 1
	})
	Speakers._ensureIndex({
		'counts.words': 1
	})
}
if(Meteor.isClient) {
	window.Speakers = Speakers;
}
if(Meteor.isServer) {
	global.Speakers = Speakers;
}

const Fragments = new Mongo.Collection('fragments');
if(Meteor.isServer) {
	Fragments._ensureIndex({
		UID: 1
	})
}
if(Meteor.isClient) {
	window.Fragments = Fragments;
}
if(Meteor.isServer) {
	global.Fragments = Fragments;
}

export { Bills, ResourceFiles, Files, Fragments, Speakers };
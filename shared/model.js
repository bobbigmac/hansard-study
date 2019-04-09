const Bills = new Mongo.Collection('bills');
const ResourceFiles = new Mongo.Collection('resource-files');
const Files = new Mongo.Collection('files');

const Speakers = new Mongo.Collection('speakers');

// Setup indexes (indices?)
if(Meteor.isServer) {
	Speakers._ensureIndex({ 'pimsId': 1 })
	Speakers._ensureIndex({ 'fk': 1 })
	Speakers._ensureIndex({ 'counts.fragments': 1 })
	Speakers._ensureIndex({ 'counts.words': 1 })

	//TODO: Index terms.words case insensitive
	//TODO: Index terms.phrase case insensitive
	
	//TODO: Remove this (any way to index these?
	Speakers._ensureIndex({ 'terms.wordsHash.brexit.score': 1 })
	Speakers._ensureIndex({ 'terms.wordsHash.brexit.pw': 1 })
}

const Fragments = new Mongo.Collection('fragments');
if(Meteor.isServer) {
	Fragments._ensureIndex({ UID: 1 })
}

// Setup convenience globals
if(Meteor.isClient) {
	window.Fragments = Fragments;
	window.Speakers = Speakers;
}
if(Meteor.isServer) {
	global.Speakers = Speakers;
	global.Fragments = Fragments;
}

export { Bills, ResourceFiles, Files, Fragments, Speakers };
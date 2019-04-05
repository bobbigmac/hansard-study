const Bills = new Mongo.Collection('bills');
const ResourceFiles = new Mongo.Collection('resource-files');
const Files = new Mongo.Collection('files');

const Speakers = new Mongo.Collection('speakers');
if(Meteor.isServer) {
	Speakers._ensureIndex({
		pimsId: 1
	})
}

const Fragments = new Mongo.Collection('fragments');
if(Meteor.isServer) {
	Fragments._ensureIndex({
		UID: 1
	})
}

export { Bills, ResourceFiles, Files, Fragments, Speakers };
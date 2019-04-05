import { Template } from 'meteor/templating';

Template.registerHelper("twitterLink",function(twitterUrl) {
	return twitterUrl;
});

Template.registerHelper("averageArray",function(arr = [], decimals = 2) {
	return (arr.reduce((sum, curr) => sum + curr, 0) / arr.length).toFixed(decimals);
});

Template.registerHelper("twitterName",function(twitterUrl) {
	// return (twitterUrl || '').split('/');
	return "@" + (new URL(twitterUrl)).pathname.replace(/\//g, '');
});
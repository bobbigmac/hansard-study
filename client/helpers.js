import { Template } from 'meteor/templating';

Template.registerHelper("twitterLink",function(twitterUrl) {
	return twitterUrl;
});
Template.registerHelper("log",function(a) {
	console.log(a);
});

Template.registerHelper("averageArray",function(arr = [], decimals = 2) {
	return (arr.reduce((sum, curr) => sum + curr, 0) / arr.length).toFixed(decimals);
});

Template.registerHelper("deepProp",function(obj = {}, a = null, b = null, c = null) {
	const decimals = 2;
	// console.log(obj, a, b, c, decimals);
	if(c && typeof c === 'string') {
		return Number.parseFloat(''+(obj[a] && obj[a][b] && obj[a][b][c]), 10).toFixed(decimals);
	}
	if(b && typeof b === 'string') {
		return Number.parseFloat(''+(obj[a] && obj[a][b]), 10).toFixed(decimals);
	}
	if(a && typeof a === 'string') {
		return Number.parseFloat(''+(obj[a]), 10).toFixed(decimals);
	}
});
Template.registerHelper("deepPropPct",function(obj = {}, a = null, b = null, c = null) {
	const decimals = 2;
	// console.log(obj, a, b, c, decimals);
	if(c && typeof c === 'string') {
		return (Number.parseFloat(''+(obj[a] && obj[a][b] && obj[a][b][c]), 10) * 100).toFixed(decimals);
	}
	if(b && typeof b === 'string') {
		return (Number.parseFloat(''+(obj[a] && obj[a][b]), 10) * 100).toFixed(decimals);
	}
	if(a && typeof a === 'string') {
		return (Number.parseFloat(''+(obj[a]), 10) * 100).toFixed(decimals);
	}
});

Template.registerHelper("cleanPartyName",function(name = '') {
	return (name || '').replace(' (Co-op)', '').trim();
});

Template.registerHelper("sortClass",function(key, usedKey, usedDirection = -1) {
	const outClass = 
		(key === usedKey ? 'sort-selected' : 'sort-unselected')
		+ ' ' +
		(usedDirection === -1 ? 'downwards' : 'upwards');
	// console.log(key, usedKey, usedDirection, outClass);
	return outClass;
});

Template.registerHelper("toFixed",function(num, decimals = 2) {
	return Number.parseFloat(''+num, 10).toFixed(decimals);
});

Template.registerHelper("twitterName",function(twitterUrl) {
	// return (twitterUrl || '').split('/');
	return "@" + (new URL(twitterUrl)).pathname.replace(/\//g, '');
});
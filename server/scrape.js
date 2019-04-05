import { Meteor } from 'meteor/meteor';
import { ResourceFiles, Files, Fragments } from '/shared/model.js';

import RemapKeys from '/server/remap-keys.js';

const yauzl = require("yauzl");
const request = require('request');
const xml2js = require('xml2js');
const crypto = require('crypto');

const streamToBuffer = function(readStream, cb) {
	const parts = [];

	readStream.on('end', function() {
		cb && cb(false, Buffer.concat(parts));
	});

	readStream.on('error', function(error){
		cb && cb(error);
	});

	readStream.on('data', function(d){
		parts.push(d);
	});
}

const forEachFileInZipBuffer = function(buffer, cb) {
	yauzl.fromBuffer(buffer, (error, zipfile) => {
		if(zipfile) {
			zipfile.on("error", function(error) {
				console.error(error);
			});

			zipfile.on("entry", function(entry) {
				if (/\/$/.test(entry.fileName)) {
				} else {
					zipfile.openReadStream(entry, function(err, readStream) {
						err && console.error(err);
						!err && streamToBuffer(readStream, function(err, buffer) {
							err && console.error(err);

							if(!err) {
								if(/\.zip$/.test(entry.fileName)) {
									console.log('Want to parse sub-zip', entry.fileName);
									forEachFileInZipBuffer(buffer, cb);
								} else if(/\.xml$/.test(entry.fileName)) {
									// console.log('Got buffer for fileName', entry.fileName, buffer);
									cb(false, entry.fileName, buffer);
								} else if(/\.pdf$/.test(entry.fileName)) {
									console.log('Ignoring pdf', entry.fileName);
									// cb(false, entry.fileName);//, zipfile
								}
							}
						});
					});
				}
			});
		} else {
			console.warn('No zipfile in buffer', error);
			cb && cb(error, false);
		}
	});
}

const scrape = function() {
	ResourceFiles.find({
		scanned: {$exists:false}
	}, {
		limit: 1,
	}).observeChanges({
		added: function (resourceId, resource) {
			Meteor.setTimeout(() => {
				console.log('Scanning resource', resourceId);
				// console.log(resourceId);

				const addFragment = Meteor.bindEnvironment(function(file) {
				});

				const addFile = Meteor.bindEnvironment(function(file) {
					const _id = file._id;
					delete file._id;

					// console.log(file.House, Array.from(file.House));
					
					file && file.House && Object.values(file.House).map(house => {
								
						let lastMember = undefined;
						
						house && house.System && Object.values(house.System).map(system => {
							
							system && system.Fragment && Object.values(system.Fragment).map(fragment => {

								fragment && fragment.Body && Object.values(fragment.Body).map(body => {

									body && body.hs_Para && Object.values(body.hs_Para).map(para => {
										if(para && para._) {
											lastMember = (para.B && para.B[0] && para.B[0] && para.B[0].Member && Object.values(para.B[0].Member).map(member => {
												return {
													name: member._.replace(/\r\n/g, ' ').replace(/\s+/g, ' ').trim(),
													mnisId: member._meta && member._meta.MnisId,
													pimsId: member._meta && member._meta.PimsId,
													action: member._meta && member._meta.ContributionType,
													ct: member._meta && member._meta.ContinuationText,
												}
											})) || lastMember;

											const newFragment = {
												UID: para._meta && para._meta.UID,
												resource: resourceId,
												url: para._meta && para._meta.url,
												text: para._.replace(/\r\n/g, ' ').replace(/\s+/g, ' ').replace(/hon\./g, 'honorable').trim(),
												time: para.hs_TimeCode && para.hs_TimeCode[0] && para.hs_TimeCode[0]._meta && para.hs_TimeCode[0].time,
												speaker: lastMember && lastMember[0],
											};

											const newFragmentId = Fragments.upsert({
												UID: newFragment.UID,
											}, {
												$set: newFragment
											});
											console.log('Added', newFragment, 'as', newFragmentId);
										}
									});
								});
							});
						})
					});
					// Files.upsert({ _id: _id }, {
					// 	$set: file
					// });
				});

				const moveOn = Meteor.bindEnvironment(function() {
					ResourceFiles.update(resourceId, {
						$set: {scanned: true}
					})
				});

				request({
					url: resource.link, 
					encoding: null,
				}, function(error, response, body) {
					if (error || response.statusCode != "200") {
						console.error('Could not request', resource.link);
						return;
					}

					forEachFileInZipBuffer(body, function(error, filename, content) {
						error && console.error(error);

						if(content && !error) {
							// console.log('Got a file', error, filename, content);

							var parser = new xml2js.Parser();
							parser.parseString(content.toString(), function (err, result) {
								result = ((result && result.HansardDoc) || result);
								result.filename = filename;
								result.resourceId = resourceId;

								result._id = [resourceId, filename].join('_');
								// console.log(err, result, result.House[0].System);
								addFile(RemapKeys.remap_keys(result));
							});
						}

						setTimeout(moveOn, 1000);
					});
				});
			}, 4000);
		}
	});
}

export default {
	scrape
};
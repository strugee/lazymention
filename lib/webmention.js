/*

Copyright 2017 AJ Jordan <alex@strugee.net>.

This file is part of lazymention.

lazymention is free software: you can redistribute it and/or modify it
under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

lazymention is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public
License along with lazymention. If not, see
<https://www.gnu.org/licenses/>.

*/

'use strict';

var cheerio = require('cheerio'),
    webmention = require('send-webmention'),
    _ = require('lodash'),
    uuid = require('uuid'),
    db = require('./persistence'),
    _log = require('./log').child({component: 'webmention'});

// XXX handle post edits

module.exports = function sendWebmention(sourceUrl, updatedTimestamp, html, cb) {
	var log = _log.child({job_id: uuid.v4()});

	log.info({url: sourceUrl}, 'Processing Webmentions for URL.');

	db.get(sourceUrl, function(err, data) {
		if (err) {
			cb(err);
			return;
		}

		if (data.lastSentWebmention > updatedTimestamp) {
			log.debug({
				lastSent: data.lastSentWebmention,
				postTimestamp: updatedTimestamp
			}, 'Ignoring URL because we\'ve seen this post before.');
			cb();
			return;
		}

		var $ = cheerio.load(html);

		var links = $('a'),
		    jobs = 0;

		links.each(function(idx, el) {
			// XXX log `el` with a nice Bunyan formatter
			log.debug({target: el.attribs.href}, 'Attempting to send Webmention.');
			jobs++;
			webmention(sourceUrl, el.attribs.href, function(err, result) {
				if (err) {
					// XXX what constitutes an "error" from this library?
					log.error({target: el.attribs.href, err: err}, 'Error sending Webmention.');
					cb(err);
					return;
				}

				// TODO maybe do something intellingent with result

				log.debug({target: el.attribs.href}, 'Finished Webmention send attempt.');

				jobs--;

				// XXX should we do some sort of db merge instead?
				if (jobs === 0) {
					log.debug('Completed Webmention processing.');
					db.set(sourceUrl, _.assign(data, {
						// Normalize to seconds
						lastSentWebmention: Date.now() / 1000
					}), cb);
				}
			});
		});
	});
};

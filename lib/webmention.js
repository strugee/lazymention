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
    uuid = require('uuid');

module.exports = function createWebmentionDispatcher(_log, db) {
	_log = _log.child({component: 'webmention'});

	return function sendWebmention(sourceUrl, updatedTimestamp, html, cb) {
		var log = _log.child({job_id: uuid.v4()});

		log.info({url: sourceUrl}, 'Processing Webmentions for URL.');

		db.get('PAGE', sourceUrl, function(err, data) {
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
				// XXX should we try to check for malformed URLs in a more generic way...?
				if (el.attribs.href.length === 0) {
					log.debug('Dropping attempt to send Webmention to empty href.');
					return;
				}

				// XXX log `el` with a nice Bunyan formatter
				log.debug({target: el.attribs.href}, 'Attempting to send Webmention.');
				jobs++;
				webmention(sourceUrl, el.attribs.href, function(err, result) {
					if (err) {
						log.error({target: el.attribs.href, err: err}, 'Error sending Webmention.');
						cb(err);
						return;
					}

					// TODO maybe do something intellingent with result

					log.debug({
						target: el.attribs.href,
						success: result.success,
						status_code: (result.res || {statusCode: undefined}).statusCode
					}, 'Finished Webmention send attempt.');

					jobs--;

					// XXX should we do some sort of db merge instead?
					if (jobs === 0) {
						log.debug('Completed Webmention processing.');
						db.set('PAGE', sourceUrl, _.assign(data, {
							// Normalize to seconds
							lastSentWebmention: Date.now() / 1000
						}), cb);
					}
				});
			});

			if (jobs === 0) {
				log.debug('Nothing to do; completed Webmention processing.');
				process.nextTick(cb);
			}
		});
	};
};

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
    webmention = require('webmention-client'),
    _ = require('lodash'),
    db = require('./persistence');

// XXX handle post edits

module.exports = function sendWebmention(sourceUrl, updatedTimestamp, html, cb) {
	db.get(sourceUrl, function(err, data) {
		// XXX don't be terrible
		if (err) throw err;

		if (data.lastSentWebmention > updatedTimestamp) {
			cb();
			return;
		}

		var $ = cheerio.load(html);

		var links = $('a'),
		    jobs = 0;

		links.each(function(idx, el) {
			jobs++;
			webmention(sourceUrl, el.attribs.href, function(err, result) {
				// TODO do something intellingent with err, and maybe result
				// XXX should we do some sort of db merge instead?
				db.set(sourceUrl, _.assign(data, {
					// Normalize to seconds
					lastSentWebmention: Date.now() / 1000
				}), function() {
					jobs--;
					if (jobs === 0) {
						cb();
					}
				});
			});
		});
	});
};

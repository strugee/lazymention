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

var express = require('express'),
    compression = require('compression'),
    _ = require('lodash'),
    mf2 = require('microformat-node'),
    get = require('./get'),
    handleNode = require('./hentries'),
    webmention = require('./webmention'),
    app = express(),
    router = express.Router();

app.use(compression());

router.post('/submit', function(req, res, next) {
	// TODO assign a URL for status checks
	res.status(202);

	get('https://strugee.net/blog/', function(err, html) {
		// TOOO do something intelligent with `err`
		mf2.get({html: html}, function(err, data) {
			data.items.forEach(function(root) {
				handleNode('https://strugee.net/blog/', root, function(err, arr) {
					if (err) throw err;

					arr.forEach(function (entry) {
						// XXX pass an updated timestamp
						webmention(entry.resolvedUrl, 0, entry.html, function(err) {
							// TODO logging, update status check URL, etc.
						});
					});
				});
			});
		});
	});

	res.end();
});

app.use('/jobs/', router);

module.exports.app = app;
module.exports.router = router;

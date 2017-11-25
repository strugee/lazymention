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
    uuid = require('uuid');

function makeRouter(_log, db) {
	var router = express.Router(),
	    handleNode = require('./hentries')(_log),
	    webmention = require('./webmention')(_log, db),
	    get = require('./get')(_log);

	router.post('/submit', function(req, res, next) {
		req.log.info({req: req}, 'Handling incoming request.');

		// TODO assign a URL for status checks

		if (_.isEmpty(req.body)) {
			res.status(400);
			res.end('JSON object was empty, or wrong Content-Type provided');
			req.log.info({res: res}, 'Returning error due to malformed request JSON.');
			return;
		}

		var target = req.body.url;

		if (!target) {
			res.status(400);
			res.end('No URL provided');
			req.log.info({res: res}, 'Returning error due to missing URL in request.');
			return;
		}

		res.status(202);

		req.log.info({res: res, url: target}, 'Triggered Webmention processing from inbound request.');

		get(target, function(err, html) {
			if (err) {
				req.log.error({err: err}, 'Error retrieving submitted URL.');
				// XXX update status
				return;
			}

			mf2.get({html: html}, function(err, data) {
				if (err) {
					req.log.error({err: err}, 'Error parsing outer mf2 markup.');
					// XXX update status
					return;
				}

				data.items.forEach(function(root) {
					req.log.debug('Queueing mf2 child for processing.');
					handleNode(target, root, function(err, arr) {
						if (err) {
							req.log.error({err: err}, 'Error parsing outer mf2 markup.');
							// XXX update status
							return;
						}

						arr.forEach(function (entry) {
							// XXX pass an updated timestamp
							webmention(entry.resolvedUrl, 0, entry.html, function(err) {
								if (err) {
									req.log.error({err: err}, 'Error during Webmention processing.');
									// XXX update status
									return;
								}

								// TODO update status check URL, etc.
								req.log.info('Finished Webmention processing.');
							});
						});
					});
				});
			});
		});

		res.end();
		req.log.info({res: res}, 'Jobs queued; returning success.');
	});

	return router;
}

function makeApp(_log, db) {
	var app = express(),
	    router = makeRouter(_log, db);

	app.use(compression());
	app.use(express.json());

	app.use(function(req, res, next) {
		// XXX pass this into modules
		req.log = _log.child({req_id: uuid.v4()});
		next();
	});



	app.use('/jobs/', router);

	return app;
}

module.exports.makeApp = makeApp;
module.exports.makeRouter = makeRouter;

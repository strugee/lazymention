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
    uuid = require('uuid'),
    url = require('url'),
    assert = require('assert'),
    createWebmentionDispatcher = require('./webmention'),
    createGetter = require('./get'),
    createHentriesHandler = require('./hentries'),
    persistence = require('./persistence'); // Not used, only exported

function makeRouter(createDb) {
	assert(typeof createDb === 'function');

	var router = express.Router();

	router.post('/submit', function(req, res, next) {
		var db = createDb(req.log),
		    handleNode = createHentriesHandler(req.log),
		    webmention = createWebmentionDispatcher(req.log, db),
		    get = createGetter(req.log);

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

		var hostname = url.parse(target).hostname;
		if (req.config.domains.length > 0 && !req.config.domains.includes(hostname)) {
			res.status(403);
			res.end('Domain ' + hostname + ' not in server whitelist');
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

function makeApp(config, _log, createDb) {
	assert(typeof config === 'object');
	assert(typeof _log === 'object');
	assert(typeof _log.info === 'function');
	assert(typeof createDb === 'function');

	var app = express(),
	    router = makeRouter(createDb);

	app.use(compression());
	app.use(express.json());

	app.use(function(req, res, next) {
		// XXX pass this into modules
		req.log = _log.child({req_id: uuid.v4()});
		req.config = config;
		next();
	});



	app.use('/jobs/', router);

	return app;
}

module.exports.makeApp = makeApp;
module.exports.makeRouter = makeRouter;
module.exports.persistence = persistence;

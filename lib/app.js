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
    uuid = require('uuid'),
    crawl = require('crawl-mf2'),
    url = require('url'),
    assert = require('assert'),
    createWebmentionDispatcher = require('./webmention'),
    createGetter = require('./get'),
    persistence = require('./persistence'); // Not used, only exported

function makeRouter(createDb) {
	assert(typeof createDb === 'function');

	var router = express.Router();

	router.use(function(req, res, next) {
		req.db = createDb(req.log);
		next();
	});

	router.post('/submit', function(req, res, next) {
		var webmention = createWebmentionDispatcher(req.log, req.db),
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
			return;
			req.log.info({res: res, domain: hostname}, 'Returning Forbidden due to domain not in whitelist.');
		}

		res.status(202);

		req.log.info({url: target}, 'Triggered Webmention processing from inbound request.');

		// XXX UA
		var crawler = crawl(target);

		crawler.on('error', function(err) {
			req.warn({err: err}, 'Error while crawling microformats2.');
		});

		// XXX update status throughout this bit
		crawler.on('h-entry', function(url, node) {
			req.log.info('Found canonical h-entry; triggering Webmention processing.');
			// XXX pass an updated timestamp
			webmention(url, 0, node.properties.content[0].html, function(err) {
				if (err) {
					req.log.error({err: err}, 'Error during Webmention processing.');
					// XXX update status
					return;
				}

				// TODO update status check URL, etc.
				req.log.info('Finished Webmention processing.');
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

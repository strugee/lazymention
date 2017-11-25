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

// XXX if we turn this fully async, make this an EventEmitter or
// something, so you don't have to wait for the array to be fully
// built and can work on individual pages as they're found

var assert = require('assert'),
    url = require('url'),
    mf2 = require('microformat-node'),
    uuid = require('uuid'),
    get = require('./get');

function noop() {}

function _handleNode(baseUrl, thisUrl, node, log, enqueue, callback) {
	// XXX should we use more child logs here for better job tracking?
	// TODO error handling is shitty and also basically nonexistant
	assert(node.type.length === 1);

	if (node.type[0] === 'h-feed') {
		log.trace('Found an h-feed.');
		node.children.forEach(function(child) {
			log.trace('Processing h-feed child.');
			var postUrl = child.properties.url;

			assert(postUrl.length <= 1);

			enqueue();

			if (postUrl.length === 1) {
				var resolvedUrl = url.resolve(baseUrl, postUrl[0]);

				log.trace({resolved_url: resolvedUrl}, 'Child URL has length 1; assumed h-entry, resolved to canonical URL and now triggering retrieval.');

				// XXX recognize infinite recursion, where the post links to itself
				get(resolvedUrl, function(err, data) {
					// XXX don't be terrible
					if (err) throw err;

					// XXX move app.js's mf2 parsing into here
					mf2.get({html: data}, function(err, data) {
						if (err) throw err;

						log.trace('Parsed mf2 and processing children.');

						data.items.forEach(function(root) {
							log.trace('Recursively processing child.');
							// We pass noop for `enqueue` because this was already enqueued
							// XXX handle the next URL having not just an h-entry (such that queues get out of sync)
							_handleNode(baseUrl, resolvedUrl, root, log, noop, callback);
						});
					});
				});

				return;
			}

			/*
			 We schedule this on the event loop because otherwise we
			 recurse and call callback(node) synchronously. This
			 means that waitingFor gets incremented once and then we
			 fire the callback, which decrements waitingFor back to
			 zero and yields back to the caller.

			 This is obviously unideal since it will always return
			 an array with only the first h-entry encountered. By
			 deferring to the event loop, we give ourselves time to
			 properly call enqueue() for every h-entry encountered,
			 thus preventing waitingFor from being too small.
			*/
			log.trace({length: postUrl.length}, 'Child URL has length >1; triggering recursive processing.');
			process.nextTick(_handleNode.bind(undefined, baseUrl, thisUrl, child, log, enqueue, callback));
		});
	} else if (node.type[0] === 'h-entry') {
		log.trace('Found an h-entry; firing callback.');

		assert(node.properties.content.length === 1);

		callback(node, thisUrl);
	} else {
		assert();
	}
}

function makeHentriesHandler(_log) {
	_log = _log.child({component: 'mf2'});

	return function handleNode(baseUrl, node, callback) {
		var log = _log.child({job_id: uuid.v4()});

		// XXX log `node` too, with a nice Bunyan serializer
		// XXX is this log message misleading? Given that we're really discovering based on a node, not a URL?
		log.info({base_url: baseUrl}, 'Performing h-entry discovery and canonicalization for URL.');

		var arr = [],
		waitingFor = 0,
		// I'm suspicious that this won't develop race conditions in the future
		callbackFired = false;

		_handleNode(baseUrl, baseUrl, node, log, function() {
			log.debug('Found and queued an h-entry.');
			waitingFor++;
		}, function(node, resolvedUrl) {
			var result = {
				resolvedUrl: resolvedUrl,
				html: node.properties.content[0].html
			};

			log.debug({resolved_url: resolvedUrl}, 'Processed an h-entry.');

			arr.push(result);

			waitingFor--;
			assert(waitingFor >= 0);

			if (waitingFor === 0) {
				log.debug('Completed all h-entry processing, firing callback.');
				assert(callbackFired === false);
				callbackFired = true;
				callback(undefined, arr);
			}
		});
	};
};

module.exports = makeHentriesHandler;

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
    get = require('./get');

function noop() {}

function _handleNode(baseUrl, node, enqueue, callback) {
	// TODO error handling is shitty and also basically nonexistant
	assert(node.type.length === 1);

	if (node.type[0] === 'h-feed') {
		node.children.forEach(function(child) {
			var postUrl = child.properties.url;

			assert(postUrl.length <= 1);

			enqueue();

			if (postUrl.length === 1) {
				// XXX recognize infinite recursion, where the post links to itself
				get(url.resolve(baseUrl, postUrl[0]), function(err, data) {
					// XXX don't be terrible
					if (err) throw err;

					// XXX move app.js's mf2 parsing into here
					mf2.get({html: data}, function(err, data) {
						if (err) throw err;

						data.items.forEach(function(root) {
							// We pass noop for `enqueue` because this was already enqueued
							// XXX handle the next URL having not just an h-entry (such that queues get out of sync)
							_handleNode(baseUrl, root, noop, callback);
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
			process.nextTick(_handleNode.bind(undefined, baseUrl, child, enqueue, callback));
		});
	} else if (node.type[0] === 'h-entry') {
		assert(node.properties.content.length === 1);

		callback(node);
	} else {
		assert();
	}
}

function handleNode(baseUrl, node, callback) {
	var arr = [],
	    waitingFor = 0,
	    // I'm suspicious that this won't develop race conditions in the future
	    callbackFired = false;

	_handleNode(baseUrl, node, function() {
		waitingFor++;
	}, function(node) {
		arr.push(node);

		waitingFor--;
		assert(waitingFor >= 0);

		if (waitingFor === 0) {
			assert(callbackFired === false);
			callbackFired = true;
			callback(undefined, arr);
		}
	});
}

module.exports = handleNode;

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

var vows = require('perjury'),
    assert = vows.assert,
    express = require('express'),
    path = require('path'),
    httputil = require('./lib/http');

// XXX also assert on an OPTIONS request

vows.describe('submission test').addBatch({
	'When we set up a server to serve posts': {
		topic: function() {
			var app = express(),
			    cb = this.callback;

			app.use(express.static(path.join(__dirname, 'data'), {
				extensions: ['html']
			}));

			var server = app.listen(17140, function(err) {
				cb(err, server);
			});
		},
		teardown: function(server) {
			if (server && server.close) {
				server.close(this.callback);
			}
		},
		'it works': function(err) {
			assert.ifError(err);
		},
		'and we set up the app': {
			topic: function() {
				var app = require('../lib/app').app,
				cb = this.callback;

				require('../lib/persistence').configure('/tmp');

				var server = app.listen(5320, 'localhost', function(err) {
					cb(err, server);
				});
			},
			teardown: function(app) {
				if (app && app.close) {
					app.close(this.callback);
				}
			},
			'it works': function(err) {
				assert.ifError(err);
			},
			'and we HTTP POST to /jobs/submit': {
				topic: function(app) {
					httputil.postJSON('/jobs/submit',
					                  {
						                  url: 'http://localhost:17140/h-feed-with-h-entries.html'
					                  },
					                  // We set a timeout because otherwise the
					                  // response handler returns 202 Accepted
					                  // immediately, Perjury finishes the rest
					                  // of the tests and exits, and the rest of
					                  // the response handler doesn't have time
					                  // to run.
					                  //
					                  // This is obviously a dirty hack because
					                  // we don't have proper end-to-end
					                  // Webmention tests, but that's the way
					                  // things are at the moment.
					                  setTimeout.bind(undefined, this.callback, 1000));
				},
				'it works': function(err) {
					assert.ifError(err);
				},
				'it returns 202 Accepted': function(err, res) {
					assert.equal(res.statusCode, 202);
				}
			},
			'and we HTTP POST to /jobs/submit with invalid JSON': {
				topic: function(app) {
					httputil.post('/jobs/submit', '{lol syntax}', this.callback);
				},
				'it works': function(err) {
					assert.ifError(err);
				},
				'it returns 400 Bad Request': function(err, res) {
					assert.equal(res.statusCode, 400);
				}

			},
			'and we HTTP POST to /jobs/submit with an empty body': {
				topic: function(app) {
					httputil.post('/jobs/submit', '', this.callback);
				},
				'it works': function(err) {
					assert.ifError(err);
				},
				'it returns 400 Bad Request': function(err, res) {
					assert.equal(res.statusCode, 400);
				}

			},
			'and we HTTP POST to /jobs/submit without a URL parameter': {
				topic: function(app) {
					httputil.postJSON('/jobs/submit', {urlll: 'http://typos.com'}, this.callback);
				},
				'it works': function(err) {
					assert.ifError(err);
				},
				'it returns 400 Bad Request': function(err, res) {
					assert.equal(res.statusCode, 400);
				}

			}
		}
	}
}).export(module);

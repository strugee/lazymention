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
    httputil = require('./lib/http'),
    apputil = require('./lib/app'),
    wrapAppSetup = apputil.wrapAppSetup;

function postToSubmit(port, key, fn) {
	var obj = {
		topic: function(app) {
			httputil.postJSON(port, '/jobs/submit',
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
			                  setTimeout.bind(undefined, this.callback, 500));
		},
		'it works': function(err) {
			assert.ifError(err);
		}
	};

	obj[key] = fn;

	return obj;
}

vows.describe('domain whitelist test').addBatch({
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
				console.log('running whitelist teardown');
				server.close(this.callback);
			}
		},
		'it works': function(err) {
			assert.ifError(err);
		},
		'and we set up the app with notlocalhost in the whitelist': wrapAppSetup({domains: ['notlocalhost']}, {
			'and we HTTP POST to /jobs/submit': postToSubmit(5320, 'it returns 403 Forbidden', function(err, res) {
				assert.equal(res.statusCode, 403);
			})
		}),
		'and we set up the app with localhost in the whitelist': wrapAppSetup({port: 5321, domains: ['localhost']}, {
			'and we HTTP POST to /jobs/submit': postToSubmit(5321, 'it returns 202 Accepted', function(err, res) {
				assert.equal(res.statusCode, 202);
			})
		}),
		'and we set up the app with an empty whitelist': wrapAppSetup({port: 5322, domains: []}, {
			'and we HTTP POST to /jobs/submit': postToSubmit(5322, 'it returns 202 Accepted', function(err, res) {
				assert.equal(res.statusCode, 202);
			})
		})
	}
}).export(module);

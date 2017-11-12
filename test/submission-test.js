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
    httputil = require('./lib/http');

vows.describe('basic submission test').addBatch({
	'When we set up the app': {
		topic: function() {
			var app = require('../lib/app').app,
			    cb = this.callback;

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
				httputil.postJSON('/jobs/submit', {url: 'https://strugee.net/blog/'}, this.callback);
			},
			'it works': function(err) {
				assert.ifError(err);
			},
			'it returns 202 Accepted': function(err, res) {
				assert.equal(res.statusCode, 202);
			}
		}
	}
}).export(module);

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
    http = require('http'),
    noopLog = require('./lib/log');

vows.describe('HTTP retrieval module').addBatch({
	'When we set up a dummy HTTP server': {
		topic: function() {
			var cb = this.callback,
			    server = http.createServer(function(req, res) {
				    if (req.url === '/generate_404') {
					    res.statusCode = 404;
					    res.end();
					    return;
				    }

				    if (req.url === '/get_ua') {
					    res.end(req.headers['user-agent']);
					    return;
				    }

				    res.end('Hello IndieWeb!');
			    });

			server.listen(57810, function(err) {
				cb(err, server);
			});
		},
		teardown: function(server) {
			if (server && server.close) {
				server.close(this.callback);
			}
		},
		'it works': function(err, server) {
			assert.ifError(err);
			assert.isObject(server);
		},
		'and we require the module': {
			topic: function() {
				return require('../dist/get');
			},
			'it works': function(err) {
				assert.ifError(err);
			},
			'it exports a factory function': function(err, createGetter) {
				assert.isFunction(createGetter);
			},
			'and we create a getter': {
				topic: function(createGetter) {
					return createGetter(noopLog);
				},
				'it works': function(err) {
					assert.ifError(err);
				},
				'we get back a function': function(err, get) {
					assert.isFunction(get);
				},
				'and we retrieve a URL from the dummy server': {
					topic: function(get) {
						get('http://localhost:57810', this.callback);
					},
					'it works': function(err) {
						assert.ifError(err);
					},
					'we get the right data back': function(err, data) {
						assert.isString(data);
						assert.equal(data, 'Hello IndieWeb!');
					}
				},
				'and we try retrieving from a nonexistant server': {
					topic: function(get) {
						var cb = this.callback;

						get('http://localhost:29834', function(err, data) {
							if (data) {
								cb(new Error('unexpected success'), data);
								return;
							}

							cb(undefined, err);
						});
					},
					'it works': function(err) {
						assert.ifError(err);
					},
					'the error is propogated back to us': function(err, result) {
						assert.isTrue(result instanceof Error);
						assert.equal('ECONNREFUSED', result.errno);
					}
				},
				'and we retrieve a route that returns 404': {
					topic: function(get) {
						var cb = this.callback;

						get('http://localhost:57810/generate_404', function(err, data) {
							if (data) {
								cb(new Error('unexpected success'), data);
								return;
							}

							cb(undefined, err);
						});
					},
					'it works': function(err) {
						assert.ifError(err);
					},
					'the 4xx status code triggers an error condition': function(err, result) {
						assert.isTrue(result instanceof Error);
						assert.isTrue(result.message.includes('returned HTTP 404'));
					}
				},
				'and we ask what User Agent we send': {
					topic: function(get) {
						get('http://localhost:57810/get_ua', this.callback);
					},
					'it works': function(err) {
						assert.ifError(err);
					},
					'we sent the right User-Agent': function(err, data) {
						assert.isTrue(data.includes('node.js/'));
						assert.isTrue(data.includes('lazymention/1.0.0'));
					}
				}
			}
		}
	}
}).export(module);

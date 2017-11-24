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
    mockFs = require('mock-fs'),
    sinon = require('sinon'),
    http = require('http'),
    concat = require('concat-stream'),
    persistenceutil = require('./lib/persistence'),
    wrapFsMocks = persistenceutil.wrapFsMocks,
    data = {
	    singleLink: '<a href="http://localhost:18762/blag/new-puppy">So cute!</a>',
	    multipleLinks: '<a href="http://localhost:18762/pics/another-doggo">Even cuter!</a> I love <a href="http://catscatscats.org/">cats</a> too!'
    };

var clock, setServerCallback, webmention;

vows.describe('Webmention module').addBatch({
	'When we set up a local server': {
		topic: function() {
			var cb = this.callback,
			    reqs = [],
			    serverCallback;

			setServerCallback = function(cb) {
				serverCallback = function(err, data) {
					if (err) console.error((new Error()).stack);
					cb(undefined, data);
				};
			};

			var server = http.createServer(function(req, res) {
				res.statusCode = 202;
				res.setHeader('Link', '</webmention>; rel="webmention"');

				if (req.url === '/webmention') {
					req.pipe(concat(function (buf) {
						reqs.push(buf.toString());
						res.end();
						console.log('dfwa');
						serverCallback(undefined, buf.toString());
					})).on('error', serverCallback);
				} else {
					res.end();
				}
			});

			server.listen(18762, function(err) {
				cb(err, server, reqs);
			});
		},
		teardown: function(server) {
			if (server && server.close) {
				server.close();
			}

			return true;
		},
		'it works': function(err) {
			assert.ifError(err);
		},
		'and we require the module with all our mocks': {
			topic: function() {
				clock = sinon.useFakeTimers(150 * 1000);

				webmention = require('../lib/webmention');

				return webmention;
			},
			teardown: function() {
				return clock.restore();
			},
			'it works': function(err) {
				assert.ifError(err);
			},
			'it exports a function': function(err, webmention) {
				assert.isFunction(webmention);
			},
			'and we set up persistence mocks': wrapFsMocks({
				'and we call the module with a post': {
					topic: function() {
						var cb = this.callback;

						setServerCallback(cb);

						webmention('http://example.com/socute',
						           100,
						           data.singleLink,
						           function(err) {
							           cb(err);
						           });
					},
					'it works': function(err) {
						assert.ifError(err);
					},
					'the server received the data': function(err, str) {
						assert.isTrue(str.includes('example.com'));
						assert.isTrue(str.includes('new-puppy'));
					},
					'and we call it with the same data': {
						topic: function() {
							var cb = this.callback;

							console.log('dfwa_FOOBAR');
							webmention('http://example.com/socute',
							           // Note: these are smaller because JS dates are in milliseconds but we're passing seconds
							           100,
							           data.singleLink,
							           function(err) {
								           if (err) {
									           cb(err);
								           }
							           });
						},
						'it works': function(err) {
							assert.ifError(err);
						},
						'the server received the data': function(err, str) {
							assert.isTrue(str.includes('example.com'));
							assert.isTrue(str.includes('new-puppy'));
						},
						'and we call it with a newer timestamp': {
							topic: function() {
								var cb = this.callback;

								// This shouldn't matter, but just in case, we set the clock to be past the edited timestamp
								clock.tick(100 * 1000);

								webmention('http://example.com/socute',
								           200,
								           data.singleLink,
								           function(err) {
									           if (err) {
										           cb(err);
									           }
								           });
							},
							teardown: function() {
								return clock.tick(-100 * 1000);
							},
							'it works': function(err) {
								assert.ifError(err);
							},
							'the server received the data': function(err, str) {
								assert.isTrue(str.includes('example.com'));
								assert.isTrue(str.includes('new-puppy'));								
							},
							// XXX find a way to not nest this so deeply - it
							// has to be this way currently so the Sinon spy is
							// called in the right order
							'and we call it with a post with multiple links': {
								topic: function() {
									var cb = this.callback;

									setServerCallback(cb);

									webmention('http://example.com/morecuteness',
									           200,
									           data.multipleLinks,
									           function(err) {
										           if (err) {
											           cb(err);
										           }
									           });
								},
								'it works': function(err) {
									assert.ifError(err);
								},
								'the server received the data': function(err, str) {
									assert.isTrue(str.includes('example.com'));
									assert.isTrue(str.includes('new-puppy'));
								}
							}

						}
					}
				}
			})
		}
	}
}).export(module);

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

/*

Yes, this file starts with a z. This is so that this test is ordered
the absolute last in the test suite.

The reason we need to do this is because it mucks with the global
state by mocking out the `send-webmention` module with a Sinon
spy. That bit of state _leaks_ out of the test and into the
environment, where it's hit by other tests trying to fire
callbacks. This means that a *completely separate test* will actually
jump into this test by calling its Perjury callback, and this does in
fact happen when the ordering is right. So we go with the cheesy
solution and simply (vaguely) guarantee that it's ordered last, so
everybody else is done with the global environment by the time we go
and fuck it all up with this terrifying hellscape of funhouse mirrors
and scary clowns.

Yes, this is a god-awful design. Yes, I am quite ashamed of it. Yes, I
plan to fix it up eventually. No, I don't have time right now.

*/

var vows = require('perjury'),
    assert = vows.assert,
    mockFs = require('mock-fs'),
    proxyquire = require('proxyquire'),
    sinon = require('sinon'),
    noopLog = require('./lib/log'),
    persistenceutil = require('./lib/persistence'),
    db = require('../lib/persistence')('/tmp')(noopLog),
    wrapFsMocks = persistenceutil.wrapFsMocks,
    data = {
	    singleLink: '<a href="http://nicenice.website/blag/new-puppy">So cute!</a>',
	    multipleLinks: '<a href="http://magic.geek/pics/another-doggo">Even cuter!</a> I love <a href="http://catscatscats.org/">cats</a> too!',
	    noLinks: 'I have absolutely no links at all.'
    };

var clock;

vows.describe('Webmention module').addBatch({
	'When we require the module with all our mocks': {
		topic: function() {
			// XXX is this coupling too much to implementation?
			var spy = sinon.spy(function(source, destination, cb) {
				cb(undefined, {success: true});
			    }),
			    module = proxyquire('../lib/webmention', {
				'send-webmention': spy
			    });

			clock = sinon.useFakeTimers(150 * 1000);

			return [spy, module];
		},
		teardown: function() {
			return clock.restore();
		},
		'it works': function(err) {
			assert.ifError(err);
		},
		'it exports a factory function': function(err, webmention) {
			assert.isFunction(webmention[1]);
		},
		'and we create a Webmention sender': {
			topic: function(fns) {
				return [fns[0], fns[1](noopLog, db)];
			},
			'it works': function(err) {
				assert.ifError(err);
			},
			'we get a function back': function(err, webmention) {
				assert.isFunction(webmention[1]);
			},
			'and we set up persistence mocks': wrapFsMocks({
				'and we call the module with a post': {
					topic: function(fns) {
						var webmention = fns[1],
						cb = this.callback;

						webmention('http://example.com/socute',
						           100,
						           data.singleLink,
						           function(err) {
							           cb(err, fns);
						           });
					},
					'it works': function(err) {
						assert.ifError(err);
					},
					'the spy was called': function(err, fns) {
						var spy = fns[0];
						assert.isTrue(spy.calledOnce);
						// XXX assert arguments
					},
					'and we call it with the same data': {
						topic: function(fns) {
							var webmention = fns[1],
							cb = this.callback;

							webmention('http://example.com/socute',
							           // Note: these are smaller because JS dates are in milliseconds but we're passing seconds
							           100,
							           data.singleLink,
							           function(err) {
								           cb(err, fns);
							           });
						},
						'it works': function(err) {
							assert.ifError(err);
						},
						'the spy wasn\'t called again': function(err, fns) {
							var spy = fns[0];
							assert.isTrue(spy.calledOnce);
						},
						'and we call it with a newer timestamp': {
							topic: function(fns) {
								var webmention = fns[1],
								    cb = this.callback;

								// This shouldn't matter, but just in case, we set the clock to be past the edited timestamp
								clock.tick(100 * 1000);

								webmention('http://example.com/socute',
								           200,
								           data.singleLink,
								           function(err) {
									           cb(err, fns);
								           });
							},
							teardown: function() {
								return clock.tick(-100 * 1000);
							},
							'it works': function(err) {
								assert.ifError(err);
							},
							'the spy was called a second time': function(err, fns) {
								var spy = fns[0];
								assert.isTrue(spy.calledTwice);
								// XXX assert arguments
							},
							// XXX find a way to not nest this so deeply - it
							// has to be this way currently so the Sinon spy is
							// called in the right order
							'and we call it with a post with multiple links': {
								topic: function(fns) {
									var webmention = fns[1],
									cb = this.callback;

									webmention('http://example.com/morecuteness',
									           200,
									           data.multipleLinks,
									           function(err) {
										           cb(err, fns);
									           });
								},
								'it works': function(err) {
									assert.ifError(err);
								},
								'the spy was called two more times': function(err, fns) {
									var spy = fns[0];
									assert.equal(spy.callCount, 4);
									// XXX args
								},
								'and we call the module with a post that has no links at all': {
									topic: function(fns) {
										var webmention = fns[1],
										cb = this.callback;

										webmention('http://ordinary.net/bland_post',
										           200,
										           data.noLinks,
										           function(err) {
											           cb(err, fns);
										           });
									},
									'it works': function(err) {
										assert.ifError(err);
									},
									'the spy wasn\'t called again': function(err, fns) {
										var spy = fns[0];
										assert.equal(spy.callCount, 4);
										// XXX args
									}
								}
							}
						}
					}
				}
			})
		}
	}
}).export(module);

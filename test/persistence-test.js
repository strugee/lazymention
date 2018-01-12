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
    _ = require('lodash'),
    noopLog = require('./lib/log'),
    persistenceutil = require('./lib/persistence'),
    wrapFsMocks = persistenceutil.wrapFsMocks;

var getNonexistantKey = {
	topic: function(db) {
		db.get('TEST', 'lolnope', this.callback);
	},
	'it worked': function(err) {
		assert.ifError(err);
	},
	'it gave us an empty object': function(err, result) {
		assert.isObject(result);
		assert.isTrue(_.isEmpty(result));
	}
};

var getKey = {
	topic: function(db) {
		db.get('TEST', 'meaning_of_life', this.callback);
	},
	'it worked': function(err) {
		assert.ifError(err);
	},
	'it has the value we set': function(err, result) {
		assert.isNumber(result);
		assert.equal(result, 42);
	}
};

vows.describe('persistence module').addBatch({
	'When we require the module': {
		topic: function() {
			return require('../dist/persistence');
		},
		'it works': function(err) {
			assert.ifError(err);
		},
		// I hate this so damn much
		'it exports a factory creation function': function(err, createDbFactory) {
			assert.isFunction(createDbFactory);
		},
		'and we create a persistence database factory': {
			topic: function(createDbFactory) {
				debugger;
				return createDbFactory('/tmp');
			},
			'it we get back a factory function': function(err, createDb) {
				assert.isFunction(createDb);
			},
			'and we create a persistence database instance': {
				topic: function(createDb) {
					return createDb(noopLog);
				},
				'it has the right functions': function(err, db) {
					assert.isFunction(db.get);
					assert.isFunction(db.set);
				},
				'and we mock out the `fs` module': wrapFsMocks(false, {
					'and we set a key': {
						topic: function(db) {
							var cb = this.callback;
							db.set('TEST', 'meaning_of_life', 42, function(err) {
								cb(err, db);
							});
						},
						'it works': function(err) {
							assert.ifError(err);
						},
						'and we get the key': getKey,
						'and we get the key from a different namespace': {
							topic: function(db) {
								db.get('TSET', 'meaning_of_life', this.callback);
							},
							'it worked': function(err) {
								assert.ifError(err);
							},
							'it gave us an empty object': function(err, result) {
								assert.isObject(result);
								assert.isTrue(_.isEmpty(result));
							}
						}
					},
					'and we set a key with a slash': {
						topic: function(db) {
							var cb = this.callback;
							db.set('TEST', 'lazymention/subkey', {foo: 'bar'}, function(err) {
								cb(err, db);
							});
						},
						'it works': function(err) {
							assert.ifError(err);
						},
						'and we get the key': {
							topic: function(db) {
								db.get('TEST', 'lazymention/subkey', this.callback);
							},
							'it worked': function(err, obj) {
								assert.ifError(err);
								assert.equal(obj.foo, 'bar');
							}
						},
						'and we set up a new instance to bust the cache': {
							topic: function() {
								return require('../dist/persistence')('/tmp')(noopLog);
							},
							'it worked': function(err) {
								assert.ifError(err);
							},
							'and we get a key': getKey,
							'and we get a nonexistant key': getNonexistantKey
						}
					},
					'and we get a nonexistant key': getNonexistantKey
				})
			}
		}
	}
}).export(module);

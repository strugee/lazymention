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
    mockFs = require('mock-fs');

vows.describe('persistence module').addBatch({
	'When we require the module': {
		topic: function() {
			return require('../lib/persistence');
		},
		'it works': function(err) {
			assert.ifError(err);
		},
		'it exports the right functions': function(err, db) {
			assert.isFunction(db.configure);
			assert.isFunction(db.get);
			assert.isFunction(db.set);
		},
		'and we mock out the `fs` module': {
			topic: function(db) {
				mockFs({
					'/tmp': mockFs.directory()
				});
				return db;
			},
			teardown: function() {
				mockFs.restore();
				return true;
			},
			'it works': function(err) {
				assert.ifError(err);
			},
			'and we configure the module with a path': {
				topic: function(db) {
					db.configure('/tmp');
					return db;
				},
				'it works': function(err) {
					assert.ifError(err);
				},
				'and we set a key': {
					topic: function(db) {
						var cb = this.callback;
						db.set('meaning_of_life', 42, function(err) {
							cb(err, db);
						});
					},
					'it works': function(err) {
						assert.ifError(err);
					},
					'and we get the key': {
						topic: function(db) {
							debugger;
							db.get('meaning_of_life', this.callback);
						},
						'it worked': function(err) {
							assert.ifError(err);
						},
						'it has the value we set': function(err, result) {
							assert.isNumber(result);
							assert.equal(result, 42);
						}
					}
				},
				'and we set a key with a slash': {
					topic: function(db) {
						var cb = this.callback;
						db.set('lazymention/subkey', 42, function(err) {
							cb(err, db);
						});
					},
					'it works': function(err) {
						assert.ifError(err);
					},
					'and we get the key': {
						topic: function(db) {
							debugger;
							db.get('meaning_of_life', this.callback);
						},
						'it worked': function(err) {
							assert.ifError(err);
						}
					}
				},
				'and we get a nonexistant key': {
					topic: function(db) {
						db.get('meaning_of_life', this.callback);
					},
					'it worked': function(err) {
						assert.ifError(err);
					},
					'it gave us an empty object': function(err, result) {
						assert.isObject(result);
						assert.isTrue(_.isEmpty(result));
					}
				}
			}
		}
	}
}).export(module);

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
    noopLog = require('./lib/log'),
    db = require('../lib/persistence');

vows.describe('app module test').addBatch({
	'When we get the app module': {
		topic: function() {
			return require('../lib/app');
		},
		'it works': function(err) {
			assert.ifError(err);
		},
		'it exports an Express application factory function': function(err, app) {
			assert.isFunction(app.makeApp);
		},
		'it exports an Express Router factory function': function(err, app) {
			assert.isFunction(app.makeRouter);
		},
		'it exports the default persistence layer implementation': function(err, app) {
			assert.isFunction(app.persistence);
		},
		'and we call makeApp()': {
			topic: function(app) {
				return app.makeApp({}, noopLog, db('/tmp'));
			},
			'it works': function(err) {
				assert.ifError(err);
			},
			'it returns an Express application': function(err, app) {
				assert.isFunction(app);
				assert.isFunction(app.listen);
			}
		},
		'and we call makeRouter()': {
			topic: function(app) {
				return app.makeRouter(db(noopLog, '/tmp'));
			},
			'it works': function(err) {
				assert.ifError(err);
			},
			'it exports an Express Router': function(err, router) {
				assert.isFunction(router);
				assert.isTrue(express.Router.isPrototypeOf(router));
			}
		}
	}
}).export(module);

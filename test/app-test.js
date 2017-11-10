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

var vows = require('perjury'),
    assert = vows.assert,
    express = require('express');

vows.describe('app module test').addBatch({
	'When we get the app module': {
		topic: function() {
			return require('../lib/app');
		},
		'it works': function(err) {
			assert.ifError(err);
		},
		'it exports an Express application': function(err, app) {
			assert.isFunction(app.app);
		},
		'it exports an Express Router': function(err, app) {
			assert.isFunction(app.router);
			assert.isTrue(express.Router.isPrototypeOf(app.router));
		}
	}
}).export(module);

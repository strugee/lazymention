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

// TODO test this file

var assert = require('perjury').assert,
    _ = require('lodash');

var appSetup = {
	topic: function() {
		var app = require('../../lib/app').app,
		    cb = this.callback;

		require('../../lib/persistence').configure('/tmp');

		var server = app.listen(5320, 'localhost', function(err) {
			cb(err, server);
		});
	},
	teardown: function(app) {
		if (app && app.close) {
			app.close(this.callback);
		}
	},
	'it works': function(err, app) {
		assert.ifError(err);
	}
}

function wrapAppSetup(obj) {
	return _.assign({}, appSetup, obj);
}

module.exports.wrapAppSetup = wrapAppSetup;

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
    _ = require('lodash'),
    mockFs = require('mock-fs');

function buildMockSetup(configurePath) {
	return {
		topic: function(passthrough) {
			mockFs({
				'/tmp': mockFs.directory()
			});
			return passthrough;
		},
		teardown: function(app) {
			mockFs.restore();
			return true;
		},
		'it works': function(err, app) {
			assert.ifError(err);
		}
	};
};

function wrapFsMocks(configurePath, obj) {
	if (!obj) {
		obj = configurePath;
		configurePath = true;
	}

	return _.assign({}, buildMockSetup(configurePath), obj);
}

module.exports.wrapFsMocks = wrapFsMocks;

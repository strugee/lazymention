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
    mockFs = require('mock-fs');

vows.describe('Webmention module').addBatch({
	'When we require the module': {
		topic: function() {
			return require('../lib/webmention');
		},
		'it works': function(err) {
			assert.ifError(err);
		},
		'it exports a function': function(err, webmention) {
			assert.isFunction(webmention);
		},
		'and we set up persistence mocks': {
			topic: function(webmention) {
				require('../lib/persistence').configure('/tmp');
				mockFs({
					'/tmp': mockFs.directory()
				});
				return webmention;
			},
			teardown: function() {
				mockFs.restore();
				return true;
			},
			'it works': function(err) {
				assert.ifError(err);
			}
		}
	}
}).export(module);

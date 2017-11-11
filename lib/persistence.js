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

// XXX implement caching
// XXX implement locking or _something_ to prevent collisions

var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    slashEscape = require('slash-escape'),
    writeFileAtomic = require('write-file-atomic');

var storagePath;

function computePath(key) {
	return path.join(storagePath, slashEscape.escape(key + '.json'));
}

function configure(path) {
	storagePath = path;
}

function get(key, cb) {
	assert(storagePath);

	fs.readFile(computePath(key), function(err, data) {
		if (err && err.code === 'ENOENT') {
			cb(undefined, {});
			return;
		}

		if (err) {
			cb(err);
			return;
		}

		cb(undefined, JSON.parse(data.toString()));
	});
}

function set(key, data, cb) {
	assert(storagePath);

	writeFileAtomic(computePath(key), JSON.stringify(data), function(err) {
		cb(err);
	});
}

module.exports.configure = configure;
module.exports.get = get;
module.exports.set = set;

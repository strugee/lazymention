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
    writeFileAtomic = require('write-file-atomic'),
    uuid = require('uuid'),
    dbLog = require('./log').child({component: 'persistence'});

var storagePath;

function computePath(key) {
	return path.join(storagePath, slashEscape.escape(key + '.json'));
}

function configure(path) {
	storagePath = path;
}

function get(key, cb) {
	assert(storagePath);

	var log = dbLog.child({job_id: uuid.v4()});

	log.debug({key: key}, 'Retrieving key.');

	fs.readFile(computePath(key), function(err, data) {
		// XXX make sure it was the leaf of the directory tree
		if (err && err.code === 'ENOENT') {
			log.debug('Key does not exist; returning empty store.');
			cb(undefined, {});
			return;
		}

		if (err) {
			log.error({err: err}, 'Error retrieving key.');
			cb(err);
			return;
		}

		data = JSON.parse(data.toString());
		log.debug({value: data}, 'Retrieved key.');
		cb(undefined, data);
	});
}

function set(key, data, cb) {
	assert(storagePath);

	var log = dbLog.child({job_id: uuid.v4()});

	log.debug({key: key, value: data}, 'Setting key.');

	writeFileAtomic(computePath(key), JSON.stringify(data), function(err) {
		if (err) {
			log.error({err: err}, 'Error setting key.');
		} else {
			log.debug('Set key.');
		}

		cb(err);
	});
}

module.exports.configure = configure;
module.exports.get = get;
module.exports.set = set;

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

var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    slashEscape = require('slash-escape'),
    writeFileAtomic = require('write-file-atomic'),
    uuid = require('uuid');

function computePath(storagePath, key) {
	// 'undefined' here because there was a bug and we have to keep backwards compat
	return path.join(storagePath, slashEscape.escape(key + '_undefined.json'));
}

function createPersistenceDbFactory(storagePath) {
	/*

	  This is a simple filesystem-backed persistence layer for lazymention. Each key
	  corresponds to one file - the filename is set to the slash-escaped key and the
	  value is serialized to JSON and written to the file.

	  The factory is initialized with a filesystem storage path and an in-memory cache
	  backed by a Map. When a write occurs, the cache is updated and a file is written
	  atomically. When a read occurs, the cache is checked and if there's a hit, the
	  callback is scheduled for invocation with the result. If there's a miss, the
	  disk is read. If there's a result the contents of the relevant file are
	  deserialized and passed to the callback; if not an empty object is passed
	  instead. Note that this means that you're always guaranteed to get an object
	  back and it will just be empty if nothing's been set before.

	  Note also that the in-memory cache serves two extremely important functions - it
	  acts as a performance boost, but it also serves as a consistency construct that
	  eliminates the need for any sort of locking. Because Node.js is single-threaded,
	  a write is guaranteed to update the cache in the same tick of the event
	  loop. Any code that would perform a read while the disk write is still in
	  progress will hit the cache and not the disk, and so get back the new, correct
	  result.

	 */

	var cache = new Map();

	return function createPersistenceDb(_dbLog) {
		var dbLog = _dbLog.child({component: 'persistence'});

		return {
			get: function(namespace, _key, cb) {
				assert(storagePath);

				var log = dbLog.child({job_id: uuid.v4()}),
				    key = namespace + '_' + _key;

				log.debug({key: key}, 'Retrieving key.');

				// XXX should we cache empty results?
				if (cache.has(key)) {
					log.trace({key: key}, 'Returning key from in-memory cache.');
					process.nextTick(cb.bind(undefined, undefined, cache.get(key)));
					return;
				}

				fs.readFile(computePath(storagePath, key), function(err, data) {
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
			},
			set: function(namespace, _key, data, cb) {
				assert(storagePath);

				var log = dbLog.child({job_id: uuid.v4()}),
				    key = namespace + '_' + _key;

				log.debug({key: key, value: data}, 'Setting key.');

				cache.set(key, data);

				writeFileAtomic(computePath(storagePath, key), JSON.stringify(data), function(err) {
					if (err) {
						// XXX should we do something more drastic here? Maybe restore the old value or crash?
						log.error({err: err}, 'Error setting key; in-memory cache is out-of-sync!');
					} else {
						log.debug('Set key.');
					}

					cb(err);
				});
			}
		};
	};
}

module.exports = createPersistenceDbFactory;

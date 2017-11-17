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

var _http = require('follow-redirects').http,
    https = require('follow-redirects').https,
    url = require('url'),
    concat = require('concat-stream'),
    pkg = require('../package.json'),
    uuid = require('uuid'),
    retrievalLog = require('./log').child({component: 'get'});

module.exports = function get(path, callback) {
	var opts = url.parse(path),
	    useHTTP = opts.protocol === 'http:',
	    log = retrievalLog.child({job_id: uuid.v4()});

	log.debug({url: path}, 'Retrieving URL with HTTP GET over ' + (useHTTP ? 'HTTP.' : 'TLS.'));

	var http = useHTTP ? _http : https;

	opts.headers = {
		'User-Agent': 'node.js/' + process.versions.node + ' ' + pkg.name + '/' + pkg.version
	};

	var req = http.get(opts);

	req.on('response', function(res) {
		log.debug({res: res}, 'Received response.');
		if (res.statusCode < 200 || res.statusCode >= 300) {
			callback(new Error('Request to ' + path + ' returned HTTP ' + res.statusCode));
			return;
		}

		res.pipe(concat(function(buf) {
			callback(undefined, buf.toString());
		}));
	});

	req.on('error', function(err) {
		log.debug({err: err}, 'Encountered error during request.');
		callback(err);
	});
};

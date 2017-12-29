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

var http = require('http');

function httpPost(port, path, data, headers, callback) {
	// Make port optional
	if (typeof port === 'string') {
		callback = headers;
		headers = data;
		data = path;
		path = port;
		port = 5320;
	}

	// Make headers optional
	if (!callback) {
		callback = headers;
		headers = {};
	}

	var opts = {
		port: port,
		host: 'localhost',
		method: 'POST',
		path: path,
		headers: headers
	};

	var req = http.request(opts, function(res) {
		callback(undefined, res);
	});

	req.on('error', function(err) {
		callback(err);
	});

	req.end(data);
};

function httpPostJSON(port, path, data, callback) {
	if (typeof port === 'string') {
		callback = data;
		data = path;
		path = port;
		port = 5320;
	}

	httpPost(port, path, JSON.stringify(data), {'Content-Type': 'application/json'}, callback);
};

module.exports.post = httpPost;
module.exports.postJSON = httpPostJSON;

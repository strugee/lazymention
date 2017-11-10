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

var express = require('express'),
    compression = require('compression'),
    app = express(),
    router = express.Router();

router.use(express.json());

router.post('/post', function(req, res, next) {
	if (res.body === {}) {
		res.status(400);
		res.end('No body provided, Content-Type didn\'t match, or couldn\'t parse JSON.');
	}
});

app.use(compression);
app.use('/', router);

module.exports.app = app;
module.exports.router = router;

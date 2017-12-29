# lazymention

[![Build Status](https://travis-ci.org/strugee/lazymention.svg?branch=master)](https://travis-ci.org/strugee/lazymention)
[![Coverage Status](https://coveralls.io/repos/github/strugee/lazymention/badge.svg?branch=master)](https://coveralls.io/github/strugee/lazymention?branch=master)
[![NSP Status](https://nodesecurity.io/orgs/strugee/projects/530261ab-11a8-4f24-8b9f-55c005d0424e/badge)](https://nodesecurity.io/orgs/strugee/projects/530261ab-11a8-4f24-8b9f-55c005d0424e)
[![Greenkeeper badge](https://badges.greenkeeper.io/strugee/lazymention.svg)](https://greenkeeper.io/)

tl;dr: Support WebSub and Webmention on a static site

lazymention is a daemon that you run on a server. When you publish to your static [IndieWeb][] site, you ping lazymention, and it will poll your site, parse the microformats2 markup, and send Webmentions and WebSub notifications for content it hasn't seen before.

Webmention functionality is currently done. WebSub is planned for the future.

## Installation

    $ npm install -g lazymention

## Limitations

lazymention makes some maintainability tradeoffs that may result in denial-of-service problems if you allow input from sites you don't trust. Specifically:

* lazymention buffers all HTML pages in memory before parsing microformats2. In the future it may also retrieve multiple HTML pages per job. This may lead to high memory usage.
* lazymention's handling of microformats2 structures within pages is rather brittle. For example, if you mark an element as both an `h-entry` _and_ an `h-feed`, lazymention will probably crash. I will take PRs to fix these problems, especially those caused by nonmalicious markup, but in the meantime your process will be very dead.
* lazymention does not bother to check if it's sending Webmentions to `localhost` or loopback addresses. See the [Security Considerations section][] of the Webmention spec.

Please be aware of these constraints before running lazymention in production. The `domains` option should help with this.

Also, lazymention has no idea how to recurse into subpages of indexes. In the real world, I expect that this will not actually be a real problem.

## Running

lazymention will install a command called, fittingly, `lazymention`. You need to provide, at minimum, a storage location (you can do this on the CLI by passing `-s`), but not configuring anything else will give you a daemon running on port 8000, which is probably no good.

You can provide configuration options in three ways: CLI flags, environment variables, and JSON configuration files - CLI flags override environment variables and environment variables override JSON configs. The default config file location is `/etc/lazymention.json`, but you can override this by passing `-c <path_to_config.json>`.

If you configure with environment variables, just prefix the configuration values with `LAZYMENTION_`. CLI flags are just prefixed with `--`, as you'd expect - just run `lazymention --help` if this is confusing. You can pass more than one value for `--domains` (e.g. `--domains example.com example.net`), as well as passing `--domains` more than once (e.g. `--domains example.com --domains example.net`). If you need to specify more than one domain via environment variables, separate them using `,`.

You should also set `NODE_ENV=production` in the environment, regardless of how you're configuring lazymention.

### Configuration values

Here's what you can configure:

| Name       | Description                                                  | Default   |
| ---------- | ------------------------------------------------------------ | --------- |
| `storage`  | Where to put data. Must be read/writable by the server user. | None      |
| `port`     | Port for the HTTP server to bind to.                         | 8000      |
| `address`  | Address for the HTTP server to bind to.                      | `0.0.0.0` |
| `logger`   | Whether to have the logger write logs.                       | True      |
| `logfile`  | Where to write logs to.                                      | stdout    |
| `logLevel` | [Bunyan loglevel][] for the logger.                          | `info`    |
| `domains`  | Whitelist of domains to allow in job submissions.            | None      |

The `storage` and `domains` options are required. If you don't want to use a whitelist you can set `domains` to `[]`, but you're _strongly_ discouraged from doing so because of the security implications. In fact, the reason you have to set this manually is to make sure you know what you're doing.

## Using the API

There's exactly one API endpoint, `/jobs/submit`. To trigger lazymention, POST to this endpoint with a JSON payload in the body. The JSON should contain a `url` key whose value is the URL to crawl.

If everything goes well, you'll get back 202 Accepted. If something went wrong, you'll get back 400 Bad Request, unless the domain of the URL you provided isn't in the whitelist in which case you'll get 403 Forbidden.

In the future the reponse will contain a URL that lets you check the status of your job, but in the meantime all you get back is a lame 2xx status code.

## Author

AJ Jordan <alex@strugee.net>

## License

AGPL 3.0 or later

 [IndieWeb]: https://indieweb.org/
 [Security Considerations section]: https://www.w3.org/TR/webmention/#security-considerations
 [Bunyan loglevel]: https://github.com/trentm/node-bunyan#levels

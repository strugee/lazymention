# lazymention

[![Build Status](https://travis-ci.org/strugee/lazymention.svg?branch=master)](https://travis-ci.org/strugee/lazymention)
[![Coverage Status](https://coveralls.io/repos/github/strugee/lazymention/badge.svg?branch=master)](https://coveralls.io/github/strugee/lazymention?branch=master)

tl;dr: Support WebSub and Webmention on a static site

lazymention is a daemon that you run on a server. When you publish to your static [IndieWeb][] site, you ping lazymention, and it will poll your site, parse the microformats2 markup, and send Webmentions and WebSub notifications for content it hasn't seen before.

Currently a work in progress.

## Installation

    $ npm install -g lazymention

## Limitations

lazymention makes some maintainability tradeoffs that may result in denial-of-service problems if you allow input from sites you don't trust. Specifically:

* lazymention buffers all HTML pages in memory before parsing microformats2. In the future it may also retrieve multiple HTML pages per job. This may lead to high memory usage.
* lazymention's handling of microformats2 structures within pages is rather brittle. For example, if you mark an element as both an `h-entry` _and_ an `h-feed`, lazymention will probably crash. I will take PRs to fix these problems, especially those caused by nonmalicious markup, but in the meantime your process will be very dead.

Please be aware of these constraints before running lazymention in production.

In terms of correctness, it also will not retrieve the canonical URL for a given `h-entry`, and simply use whatever markup it first encounters. If you don't put the same markup on individual post pages as you do on feeds, you'll probably have a Bad Time™. Oh also, it has no idea how to recurse into subpages of indexes.

In the real world, I expect that these will not actually be real problems.

## Author

AJ Jordan <alex@strugee.net>

## License

AGPL 3.0 or later

 [IndieWeb]: https://indieweb.org/

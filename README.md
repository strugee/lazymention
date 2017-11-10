# lazymention

tl;dr: Support WebSub and Webmention on a static site

lazymention is a daemon that you run on a server. When you publish to your static [IndieWeb][] site, you ping lazymention, and it will poll your site, parse the microformats2 markup, and send Webmentions and WebSub notifications for content it hasn't seen before.

Currently a work in progress.

## Installation

    $ npm install -g lazymention

## Author

AJ Jordan <alex@strugee.net>

## License

AGPL 3.0 or later

 [IndieWeb]: https://indieweb.org/

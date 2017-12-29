# lazymention changelog

lazymention follows [Semantic Versioning 2.0.0][semver]. Specifically, the following things are considered to be semver-major if changed in a backwards-incompatible way:

* Configuration value names, semantics, requirements and format
* The public HTTP API
* The embedding API, including the state the router embed expects to have available
* Supported Node.js versions
* This list of items

Changes to everything else are not considered breaking. Notably, these are _not_ considered breaking:

* Log messages

If you think something that isn't in the first list should be covered, or aren't sure about something, please feel free to file an issue and I'll clarify the policy - this list could surely be more precise.

## 1.0.0 - 2017-12-29

* Initial release

 [semver]: https://semver.org/spec/v2.0.0.html

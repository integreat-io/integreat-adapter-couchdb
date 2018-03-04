# CouchDB and Cloudant support for Integreat

Adapter and authentication strategies to let
[Integreat](https://github.com/integreat-io/integreat) use CouchDb and Cloudant
as sources.

[![Build Status](https://travis-ci.org/integreat-io/integreat-adapter-couchdb.svg?branch=master)](https://travis-ci.org/integreat-io/integreat-adapter-couchdb)
[![Coverage Status](https://coveralls.io/repos/github/integreat-io/integreat-adapter-couchdb/badge.svg?branch=master)](https://coveralls.io/github/integreat-io/integreat-adapter-couchdb?branch=master)
[![Dependency Status](https://dependencyci.com/github/integreat-io/integreat-adapter-couchdb/badge)](https://dependencyci.com/github/integreat-io/integreat-adapter-couchdb)

## Getting started

### Prerequisits

Requires node v8.6 and Integreat v0.6.

### Installing and using

Install from npm:

```
npm install integreat-adapter-couchdb
```

Example of use:
```javascript
const integreat = require('integreat')
const couchdb = require('integreat-adapter-couchdb')
const defs = require('./config')

const resources = couchdb(integreat.resources())
const great = integreat(defs, resources)

// ... and then dispatch actions as usual
```

The `couchdb()` function adds the adapter `couchdb` and the authentication
strategy `couchdb` to the resources object, but you still need to configure your
source to use these.

Example source configuration:

```javascript
{
  id: 'store',
  adapter: 'couchdb',
  auth: 'couchdb',
  baseUri: 'http://mycouchdb.com/database',
  endpoints: {
    get: {uri: '/_design/store/_view/by_type_updatedAt?include_docs=true&startkey=["{type}"{updatedAfter|wrap(\\,",")?}]&endkey=["{type}",\\{\\}]', path: 'rows[].doc'},
    getOne: '/{id}',
    set: {uri: '/_bulk_docs', path: 'docs[]', method: 'POST'},
    setOne: '/{id}'
  },
  mappings: {
    '*': {}
  }
}
```

The `baseUri` is required with the `couchdb` adapter, as it is used to generate
an endpoint for getting `_rev` for existing documents. The `baseUri` should
include the host and the database name, so that it can append `_all_docs`
directly after. Ending `/` is optional.

It's also important that the path on each endpoint points to items, as the
`couchdb` adapter will override `normalize` and `serialize` methods to alter
the items. These overrides is based on the path pointing to the actual items.

Other than that, these endpoints are examples of a typical way to configure a
CouchDb database as a store for Integreat.

Note that the `get` endpoint uses a view returning all documents with an array
of `type` and `updatedAt` as key. This is a better way of returning all
documents of a type than filtering the results from `/_all_docs`. Here's an
example of such a view:

```json
{
  "views": {
    "by_type_updatedAt": {
      "map": "function (doc) { emit([doc.type, doc.updatedAt], null); }"
    }
  }
}
```

Finally, authorization might be configured like this:

```javascript
{
  id: 'couchdb',
  strategy: 'couchdb',
  options: {
    uri: process.env.COUCHDB_URL,
    key: process.env.COUCHDB_KEY,
    secret: process.env.COUCHDB_PASSWORD
  }
}
```

### Running the tests

The tests can be run with `npm test`.

## Contributing

Please read
[CONTRIBUTING](https://github.com/integreat-io/integreat-adapter-couchdb/blob/master/CONTRIBUTING.md)
for details on our code of conduct, and the process for submitting pull
requests.

## License

This project is licensed under the ISC License - see the
[LICENSE](https://github.com/integreat-io/integreat-adapter-couchdb/blob/master/LICENSE)
file for details.

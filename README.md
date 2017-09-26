# CouchDB and Cloudant support for Integreat

Necessary hooks and authentication strategies to let
[Integreat](https://github.com/kjellmorten/integreat) use CouchDb and Cloudant
as sources.

[![Build Status](https://travis-ci.org/kjellmorten/integreat-source-couchdb.svg?branch=master)](https://travis-ci.org/kjellmorten/integreat-source-couchdb)
[![Coverage Status](https://coveralls.io/repos/github/kjellmorten/integreat-source-couchdb/badge.svg?branch=master)](https://coveralls.io/github/kjellmorten/integreat-source-couchdb?branch=master)
[![Dependency Status](https://dependencyci.com/github/kjellmorten/integreat-source-couchdb/badge)](https://dependencyci.com/github/kjellmorten/integreat-source-couchdb)

## Getting started

### Prerequisits

Requires node v8.

### Installing and using

Install from npm:

```
npm install integreat-source-couchdb
```

Example of use:
```
const integreat = require('integreat')
const couchdb = require('integreat-source-couchdb')
const defs = require('./config')

const resources = couchdb(integreat.resources())
const great = integreat(defs, resources)

// ... and then dispatch actions as usual
```

The `couchdb()` function adds the hooks `couchdb-afterNormalize` and
`couchdb-beforeSerialize`, and the authentication strategy `couchdb` to the
resources object, but you still need to configure your source to use these.

CouchDb uses a JSON api, so use Integreat's built in `json` adapter.

Example source configuration:

```
{
  id: 'store',
  adapter: 'json',
  auth: 'couchdb',
  baseUri: 'http://mycouchdb.com',
  endpoints: {
    get: {uri: '/_design/store/_view/by_type_updatedAt?include_docs=true&startkey=["{type}"{updatedAfter|wrap(\\,",")?}]&endkey=["{type}",\\{\\}]', path: 'rows[].doc'},
    getOne: '/{id}',
    set: {uri: '/_bulk_docs', path: 'docs[]', method: 'POST'},
    setOne: '/{id}',
    getRevs: {uri: '/_all_docs{?keys=ids|wrap([, ", ", ]),include_docs=includeDocs?}', path: 'rows[]'}
  },
  mappings: {
    '*': {}
  },
  beforeSerialize: 'couchdb-beforeSerialize',
  afterNormalize: 'couchdb-afterNormalize'
}
```

The `getRevs` endpoint is used by `couchdb-beforeSerialize` to get the current
`rev` for the document to update. All other endpoints are just examples of a
typical way to configure a CouchDb database as a store for Integreat.

Note that the `get` endpoint uses a view returning all documents with an array
of `type` and `updatedAt` as key. This is a better way of returning all
documents of a type than filtering the results from `/_all_docs`. Here's an
example of such a view:

```
{
  "views": "by_type_updatedAt": {
    "map": "function (doc) { emit([doc.type, doc.updatedAt], null); }"
  }
}
```

Finally, authorization might be configured like this:

```
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
[CONTRIBUTING](https://github.com/kjellmorten/integreat-source-couchdb/blob/master/CONTRIBUTING.md)
for details on our code of conduct, and the process for submitting pull
requests.

## License

This project is licensed under the ISC License - see the
[LICENSE](https://github.com/kjellmorten/integreat-source-couchdb/blob/master/LICENSE)
file for details.

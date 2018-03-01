import test from 'ava'

import couchdb from './couchdb'

// Helpers

const createJson = () => ({
  prepareEndpoint: (endpoint) => endpoint,
  send: async () => {},
  normalize: async () => {},
  serialize: async () => {}
})

// Tests

test('should set up revUri', (t) => {
  const endpoint = {uri: '/entry:ent1'}
  const sourceOptions = {baseUri: 'http://some.couchdb.com'}
  const json = createJson()
  const expected = {
    uri: '/entry:ent1',
    revUri: ['http://some.couchdb.com/_all_docs']
  }

  const adapter = couchdb(json)
  const ret = adapter.prepareEndpoint(endpoint, sourceOptions)

  t.deepEqual(ret, expected)
})

test('should set revUri to null when no baseUri', (t) => {
  const endpoint = {uri: '/entry:ent1'}
  const sourceOptions = {}
  const json = createJson()
  const expected = {
    uri: '/entry:ent1',
    revUri: null
  }

  const adapter = couchdb(json)
  const ret = adapter.prepareEndpoint(endpoint, sourceOptions)

  t.deepEqual(ret, expected)
})

test('should not set double slash in revUri', (t) => {
  const endpoint = {uri: '/entry:ent1'}
  const sourceOptions = {baseUri: 'http://some.couchdb.com/'}
  const json = createJson()
  const expected = {
    uri: '/entry:ent1',
    revUri: ['http://some.couchdb.com/_all_docs']
  }

  const adapter = couchdb(json)
  const ret = adapter.prepareEndpoint(endpoint, sourceOptions)

  t.deepEqual(ret, expected)
})

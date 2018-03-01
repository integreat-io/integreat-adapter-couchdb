import test from 'ava'

import couchdb from '.'

// Helpers

const resources = {
  adapters: {
    json: {}
  },
  authstrats: {
    token: () => {}
  }
}

// Tests

test('should return resources with authstrats', (t) => {
  const ret = couchdb(resources)

  t.truthy(ret.authstrats)
  t.is(typeof ret.authstrats.couchdb, 'function')
})

test('should keep existing authstrats', (t) => {
  const ret = couchdb(resources)

  t.is(typeof ret.authstrats.token, 'function')
})

test('should return adapter', (t) => {
  const ret = couchdb(resources)

  t.truthy(ret.adapters)
  t.is(typeof ret.adapters.couchdb, 'object')
  t.is(typeof ret.adapters.couchdb.send, 'function')
})

test('should keep existing adapters', (t) => {
  const ret = couchdb(resources)

  t.is(typeof ret.adapters.json, 'object')
})

test('should throw when no json adapter', (t) => {
  t.throws(() => {
    couchdb({})
  })
})

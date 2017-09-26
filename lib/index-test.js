import test from 'ava'

import couchdb from '.'

test('should exist', (t) => {
  t.is(typeof couchdb, 'function')
})

test('should return resources with authstrats', (t) => {
  const resources = {}

  const ret = couchdb(resources)

  t.truthy(ret.authstrats)
  t.is(typeof ret.authstrats.couchdb, 'function')
})

test('should keep existing authstrats', (t) => {
  const resources = {authstrats: {token: () => {}}}

  const ret = couchdb(resources)

  t.is(typeof ret.authstrats.token, 'function')
})

test('should return resources with hooks', (t) => {
  const resources = {}

  const ret = couchdb(resources)

  t.truthy(ret.hooks)
  t.is(typeof ret.hooks['couchdb-afterNormalize'], 'function')
  t.is(typeof ret.hooks['couchdb-beforeSerialize'], 'function')
})

test('should keep existing hooks', (t) => {
  const resources = {
    hooks: {
      'other-afterNormalize': () => {}
    }
  }

  const ret = couchdb(resources)

  t.is(typeof ret.hooks['other-afterNormalize'], 'function')
})

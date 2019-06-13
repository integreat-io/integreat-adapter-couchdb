import test from 'ava'

import couchdb from './couchdb'

// Helpers

const createJson = (normalize = async () => {}) => ({
  prepareEndpoint: () => {},
  send: async () => {},
  normalize,
  serialize: async () => {}
})

// Tests

test('should change _id to id for one item', async (t) => {
  const data = { _id: 'entry:ent1', type: 'entry' }
  const json = createJson(async () => data)
  const expected = { id: 'entry:ent1', type: 'entry' }

  const adapter = couchdb(json)
  const ret = await adapter.normalize({})

  t.deepEqual(ret, expected)
})

test('should do nothing when id is already set', async (t) => {
  const data = { id: 'entry:ent1', type: 'entry' }
  const json = createJson(async () => data)
  const expected = { id: 'entry:ent1', type: 'entry' }

  const adapter = couchdb(json)
  const ret = await adapter.normalize({})

  t.deepEqual(ret, expected)
})

test('should change _id to id for more items', async (t) => {
  const data = [
    { _id: 'entry:ent1', type: 'entry' },
    { _id: 'entry:ent2', type: 'entry' }
  ]
  const json = createJson(async () => data)
  const expected = [
    { id: 'entry:ent1', type: 'entry' },
    { id: 'entry:ent2', type: 'entry' }
  ]

  const adapter = couchdb(json)
  const ret = await adapter.normalize({})

  t.deepEqual(ret, expected)
})

test('should handle no data', async (t) => {
  const data = null
  const json = createJson(async () => data)

  const adapter = couchdb(json)
  const ret = await adapter.normalize({})

  t.is(ret, null)
})

test('should handle null in data array', async (t) => {
  const data = [null]
  const json = createJson(async () => data)

  const adapter = couchdb(json)
  const ret = await adapter.normalize({})

  t.deepEqual(ret, [null])
})

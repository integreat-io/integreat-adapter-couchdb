import test from 'ava'
import sinon from 'sinon'

import couchdb from './couchdb'

// Helpers

const createJson = (send = async () => {}) => ({
  prepareEndpoint: () => {},
  send,
  normalize: async () => {},
  serialize: async () => {}
})

// Tests

test('should wrap json adapter', async (t) => {
  const json = {
    prepareEndpoint: sinon.stub(),
    send: sinon.stub().resolves({}),
    normalize: sinon.stub().resolves({}),
    serialize: sinon.stub().resolves({})
  }

  const adapter = couchdb(json)
  adapter.prepareEndpoint()
  await adapter.send({})
  await adapter.normalize()
  await adapter.serialize()

  t.is(json.prepareEndpoint.callCount, 1)
  t.is(json.send.callCount, 1)
  t.is(json.normalize.callCount, 1)
  t.is(json.serialize.callCount, 1)
})

test('should change _id to id for one item', async (t) => {
  const response = {
    status: 'ok',
    data: {_id: 'entry:ent1', type: 'entry'}
  }
  const json = createJson(async () => response)
  const expected = {
    status: 'ok',
    data: {id: 'entry:ent1', type: 'entry'}
  }

  const adapter = couchdb(json)
  const ret = await adapter.send({})

  t.deepEqual(ret, expected)
})

test('should do nothing when id is already set', async (t) => {
  const response = {
    status: 'ok',
    data: {id: 'entry:ent1', type: 'entry'}
  }
  const json = createJson(async () => response)
  const expected = {
    status: 'ok',
    data: {id: 'entry:ent1', type: 'entry'}
  }

  const adapter = couchdb(json)
  const ret = await adapter.send({})

  t.deepEqual(ret, expected)
})

test('should change _id to id for more items', async (t) => {
  const response = {
    status: 'ok',
    data: [
      {_id: 'entry:ent1', type: 'entry'},
      {_id: 'entry:ent2', type: 'entry'}
    ]
  }
  const json = createJson(async () => response)
  const expected = {
    status: 'ok',
    data: [
      {id: 'entry:ent1', type: 'entry'},
      {id: 'entry:ent2', type: 'entry'}
    ]
  }

  const adapter = couchdb(json)
  const ret = await adapter.send({})

  t.deepEqual(ret, expected)
})

test('should handle no data', async (t) => {
  const response = {
    status: 'ok',
    data: null
  }
  const json = createJson(async () => response)

  const adapter = couchdb(json)
  const ret = await adapter.send({})

  t.is(ret.data, null)
})

test('should not set data prop when not already set', async (t) => {
  const response = {
    status: 'ok'
  }
  const json = createJson(async () => response)

  const adapter = couchdb(json)
  const ret = await adapter.send({})

  t.deepEqual(ret, response)
})

test('should handle null in data array', async (t) => {
  const response = {
    status: 'ok',
    data: [null]
  }
  const json = createJson(async () => response)

  const adapter = couchdb(json)
  const ret = await adapter.send({})

  t.deepEqual(ret.data, [null])
})

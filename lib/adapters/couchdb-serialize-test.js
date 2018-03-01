import test from 'ava'
import sinon from 'sinon'

import couchdb from './couchdb'

// Helpers

const createJson = (serialize = async () => {}, send = async () => {}) => ({
  prepareEndpoint: () => {},
  send,
  normalize: async () => {},
  serialize
})

// Tests

test('should change id to _id for one item', async (t) => {
  const data = {id: 'entry:ent1', type: 'entry'}
  const serialize = sinon.stub().resolves({})
  const json = createJson(serialize)
  const expected = {_id: 'entry:ent1', type: 'entry'}

  const adapter = couchdb(json)
  await adapter.serialize(data, {})

  t.is(serialize.callCount, 1)
  t.deepEqual(serialize.args[0][0], expected)
})

test('should change id to _id for more items', async (t) => {
  const data = [
    {id: 'entry:ent1', type: 'entry'},
    {id: 'entry:ent2', type: 'entry'}
  ]
  const serialize = sinon.stub().resolves({})
  const json = createJson(serialize)
  const expected = [
    {_id: 'entry:ent1', type: 'entry'},
    {_id: 'entry:ent2', type: 'entry'}
  ]

  const adapter = couchdb(json)
  await adapter.serialize(data, {})

  t.deepEqual(serialize.args[0][0], expected)
})

test('should set _deleted on DELETE action', async (t) => {
  const data = [
    {id: 'ent1', type: 'entry'},
    {id: 'ent2', type: 'entry'}
  ]
  const request = {
    action: 'DELETE',
    endpoint: {uri: 'http://some.couchdb.com/entry:ent1'},
    data
  }
  const serialize = sinon.stub().resolves({})
  const json = createJson(serialize)
  const expectedData = [
    {_id: 'ent1', type: 'entry', _deleted: true},
    {_id: 'ent2', type: 'entry', _deleted: true}
  ]

  const adapter = couchdb(json)
  await adapter.serialize(data, request)

  t.deepEqual(serialize.args[0][0], expectedData)
})

test('should not add _deleted for other actions', async (t) => {
  const data = [{id: 'ent1', type: 'entry'}]
  const request = {
    action: 'SET',
    endpoint: {uri: 'http://some.couchdb.com/entry:ent1'},
    data
  }
  const serialize = sinon.stub().resolves({})
  const json = createJson(serialize)

  const adapter = couchdb(json)
  await adapter.serialize(data, request)

  t.false(serialize.args[0][0][0].hasOwnProperty('_deleted'))
})

test('should set rev for one item', async (t) => {
  const data = {id: 'ent1', type: 'entry'}
  const request = {
    action: 'SET',
    endpoint: {
      uri: 'http://some.couchdb.com/ent1',
      revUri: 'http://some.couchdb.com/_all_docs'
    },
    params: {id: 'ent1', type: 'entry'},
    auth: {id: 'auth1'},
    data
  }
  const serialize = sinon.stub().resolves({})
  const send = sinon.stub().resolves({
    status: 'ok',
    data: {rows: [{id: 'ent1', value: {rev: '2-rev'}}]}
  })
  const json = createJson(serialize, send)
  const expectedReq = {
    endpoint: {
      uri: 'http://some.couchdb.com/_all_docs',
      method: 'POST',
      path: [{prop: 'rows', type: 'all', spread: true}]
    },
    data: {keys: ['ent1']},
    auth: {id: 'auth1'},
    ident: {root: true}
  }
  const expectedData = {_id: 'ent1', type: 'entry', _rev: '2-rev'}

  const adapter = couchdb(json)
  await adapter.serialize(data, request)

  t.is(send.callCount, 1)
  t.deepEqual(send.args[0][0], expectedReq)
  t.is(serialize.callCount, 1)
  t.deepEqual(serialize.args[0][0], expectedData)
})

test('should not set rev on empty item', async (t) => {
  const data = null
  const request = {
    action: 'SET',
    endpoint: {
      uri: 'http://some.couchdb.com/ent1',
      revUri: 'http://some.couchdb.com/_all_docs'
    },
    params: {id: 'ent1', type: 'entry'},
    data
  }
  const serialize = sinon.stub().resolves({})
  const send = sinon.stub().resolves({
    status: 'ok',
    data: {rows: [{id: 'ent1', value: {rev: '2-rev'}}]}
  })
  const json = createJson(serialize, send)

  const adapter = couchdb(json)
  await adapter.serialize(data, request)

  t.is(send.callCount, 0)
  t.is(serialize.args[0][0], null)
})

test('should handle no rev', async (t) => {
  const data = {id: 'ent1', type: 'entry'}
  const request = {
    action: 'SET',
    endpoint: {
      uri: 'http://some.couchdb.com/ent1',
      revUri: 'http://some.couchdb.com/_all_docs'
    },
    params: {id: 'ent1', type: 'entry'},
    data
  }
  const serialize = sinon.stub().resolves({})
  const send = sinon.stub().resolves({
    status: 'ok',
    data: [{key: 'entry:ent1', error: 'not_found'}]
  })
  const json = createJson(serialize, send)

  const adapter = couchdb(json)
  await adapter.serialize(data, request)

  t.is(typeof serialize.args[0][0]._rev, 'undefined')
})

test('should handle error on rev endpoint', async (t) => {
  const data = {id: 'ent1', type: 'entry'}
  const request = {
    action: 'SET',
    endpoint: {
      uri: 'http://some.couchdb.com/ent1',
      revUri: 'http://some.couchdb.com/_all_docs'
    },
    params: {id: 'ent1', type: 'entry'},
    data
  }
  const serialize = sinon.stub().resolves({})
  const send = sinon.stub().resolves({status: 'error', error: 'Server failed'})
  const json = createJson(serialize, send)

  const adapter = couchdb(json)
  await adapter.serialize(data, request)

  t.is(typeof serialize.args[0][0]._rev, 'undefined')
})

test('should set rev for more items', async (t) => {
  const data = [
    {id: 'ent1', type: 'entry'},
    {id: 'ent3', type: 'entry'},
    {id: 'ent2', type: 'entry'}
  ]
  const request = {
    action: 'SET',
    endpoint: {
      uri: 'http://some.couchdb.com/_bulk_update',
      revUri: 'http://some.couchdb.com/_all_docs'
    },
    auth: {},
    data
  }
  const serialize = sinon.stub().resolves({})
  const send = sinon.stub().resolves({
    status: 'ok',
    data: {rows: [
      {id: 'ent1', value: {rev: '2-rev'}},
      {id: 'ent3', value: {rev: '5-rev'}},
      {id: 'ent2', value: {rev: '1-rev'}}
    ]}
  })
  const json = createJson(serialize, send)
  const expectedReq = {
    endpoint: {
      uri: 'http://some.couchdb.com/_all_docs',
      method: 'POST',
      path: [{prop: 'rows', type: 'all', spread: true}]
    },
    data: {keys: ['ent1', 'ent3', 'ent2']},
    auth: {},
    ident: {root: true}
  }
  const expectedData = [
    {_id: 'ent1', type: 'entry', _rev: '2-rev'},
    {_id: 'ent3', type: 'entry', _rev: '5-rev'},
    {_id: 'ent2', type: 'entry', _rev: '1-rev'}
  ]

  const adapter = couchdb(json)
  await adapter.serialize(data, request)

  t.is(send.callCount, 1)
  t.deepEqual(send.args[0][0], expectedReq)
  t.is(serialize.callCount, 1)
  t.deepEqual(serialize.args[0][0], expectedData)
})

test('should set existing attributes for meta', async (t) => {
  const lastSyncedAtOld = new Date('2017-05-22T19:12:00.000Z')
  const lastSyncedAt = new Date('2017-05-23T18:43:00.000Z')
  const data = {id: 'meta:entries', type: 'meta', attributes: {lastSyncedAt}}
  const request = {
    action: 'SET',
    endpoint: {
      uri: 'http://some.couchdb.com/entry:ent1',
      revUri: 'http://some.couchdb.com/_all_docs',
      method: 'PUT'
    },
    headers: {},
    auth: {},
    data
  }
  const serialize = sinon.stub().resolves({})
  const send = sinon.stub().onFirstCall().resolves({
    status: 'ok',
    data: {rows: [{
      id: 'meta:entries',
      value: {rev: '2-rev'},
      doc: {
        _id: 'meta:entries',
        type: 'meta',
        attributes: {readOnly: true, lastSyncedAt: lastSyncedAtOld}
      }
    }]}
  })
  const json = createJson(serialize, send)
  const expectedReq = {
    endpoint: {
      uri: 'http://some.couchdb.com/_all_docs?include_docs=true',
      method: 'POST',
      path: [{prop: 'rows', type: 'all', spread: true}]
    },
    data: {keys: ['meta:entries']},
    auth: {},
    ident: {root: true}
  }
  const expectedData = {
    _id: 'meta:entries',
    _rev: '2-rev',
    type: 'meta',
    attributes: {lastSyncedAt, readOnly: true}
  }

  const adapter = couchdb(json)
  await adapter.serialize(data, request)

  t.is(send.callCount, 1)
  t.deepEqual(send.args[0][0], expectedReq)
  t.is(serialize.callCount, 1)
  t.deepEqual(serialize.args[0][0], expectedData)
})

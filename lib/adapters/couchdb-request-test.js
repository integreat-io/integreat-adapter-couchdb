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

test('should change id to _id for one item', async (t) => {
  const request = {
    endpoint: {uri: 'http://some.couchdb.com/entry:ent1'},
    data: {id: 'entry:ent1', type: 'entry'}
  }
  const send = sinon.stub().resolves({})
  const json = createJson(send)
  const expected = {
    endpoint: {uri: 'http://some.couchdb.com/entry:ent1'},
    data: {_id: 'entry:ent1', type: 'entry'}
  }

  const adapter = couchdb(json)
  await adapter.send(request)

  t.is(send.callCount, 1)
  t.deepEqual(send.args[0][0], expected)
})

test('should change id to _id for more items', async (t) => {
  const request = {
    endpoint: {uri: 'http://some.couchdb.com/entry:ent1'},
    data: [
      {id: 'entry:ent1', type: 'entry'},
      {id: 'entry:ent2', type: 'entry'}
    ]
  }
  const send = sinon.stub().resolves({})
  const json = createJson(send)
  const expected = {
    endpoint: {uri: 'http://some.couchdb.com/entry:ent1'},
    data: [
      {_id: 'entry:ent1', type: 'entry'},
      {_id: 'entry:ent2', type: 'entry'}
    ]
  }

  const adapter = couchdb(json)
  await adapter.send(request)

  t.deepEqual(send.args[0][0], expected)
})

test('should set _deleted on DELETE action', async (t) => {
  const request = {
    action: 'DELETE',
    endpoint: {uri: 'http://some.couchdb.com/entry:ent1'},
    data: [
      {id: 'ent1', type: 'entry'},
      {id: 'ent2', type: 'entry'}
    ]
  }
  const send = sinon.stub().resolves({})
  const json = createJson(send)
  const expectedData = [
    {_id: 'ent1', type: 'entry', _deleted: true},
    {_id: 'ent2', type: 'entry', _deleted: true}
  ]

  const adapter = couchdb(json)
  await adapter.send(request)

  t.deepEqual(send.args[0][0].data, expectedData)
})

test('should not add _deleted for other actions', async (t) => {
  const request = {
    action: 'SET',
    endpoint: {uri: 'http://some.couchdb.com/entry:ent1'},
    data: [{id: 'ent1', type: 'entry'}]
  }
  const send = sinon.stub().resolves({})
  const json = createJson(send)

  const adapter = couchdb(json)
  await adapter.send(request)

  t.false(send.args[0][0].data[0].hasOwnProperty('_deleted'))
})

test('should set rev for one item', async (t) => {
  const request = {
    action: 'SET',
    endpoint: {
      uri: 'http://some.couchdb.com/ent1',
      revUri: 'http://some.couchdb.com/_all_docs'
    },
    params: {id: 'ent1', type: 'entry'},
    data: {id: 'ent1', type: 'entry'}
  }
  const send = sinon.stub()
  send.onFirstCall().resolves({
    status: 'ok',
    data: {rows: [{id: 'ent1', value: {rev: '2-rev'}}]}
  })
  send.resolves({})
  const json = createJson(send)
  const expectedReq = {
    endpoint: {
      uri: 'http://some.couchdb.com/_all_docs',
      method: 'POST',
      path: [{prop: 'rows', type: 'all', spread: true}]
    },
    data: {keys: ['ent1']},
    ident: {root: true}
  }
  const expectedData = {_id: 'ent1', type: 'entry', _rev: '2-rev'}

  const adapter = couchdb(json)
  await adapter.send(request)

  t.is(send.callCount, 2)
  t.deepEqual(send.args[0][0], expectedReq)
  t.deepEqual(send.args[1][0].data, expectedData)
})

test('should not set rev on empty item', async (t) => {
  const request = {
    action: 'SET',
    endpoint: {
      uri: 'http://some.couchdb.com/ent1',
      revUri: 'http://some.couchdb.com/_all_docs'
    },
    params: {id: 'ent1', type: 'entry'},
    data: null
  }
  const send = sinon.stub()
  send.onFirstCall().resolves({
    status: 'ok',
    data: {rows: [{id: 'ent1', value: {rev: '2-rev'}}]}
  })
  send.resolves({})
  const json = createJson(send)

  const adapter = couchdb(json)
  await adapter.send(request)

  t.is(send.callCount, 1)
  t.is(send.args[0][0].data, null)
})

test('should handle no rev', async (t) => {
  const request = {
    action: 'SET',
    endpoint: {
      uri: 'http://some.couchdb.com/ent1',
      revUri: 'http://some.couchdb.com/_all_docs'
    },
    params: {id: 'ent1', type: 'entry'},
    data: {id: 'ent1', type: 'entry'}
  }
  const send = sinon.stub()
  send.onFirstCall().resolves({
    status: 'ok',
    data: [{key: 'entry:ent1', error: 'not_found'}]
  })
  send.resolves({})
  const json = createJson(send)

  const adapter = couchdb(json)
  await adapter.send(request)

  t.is(send.callCount, 2)
  t.is(typeof send.args[1][0].data._rev, 'undefined')
})

test('should handle error on rev endpoint', async (t) => {
  const request = {
    action: 'SET',
    endpoint: {
      uri: 'http://some.couchdb.com/ent1',
      revUri: 'http://some.couchdb.com/_all_docs'
    },
    params: {id: 'ent1', type: 'entry'},
    data: {id: 'ent1', type: 'entry'}
  }
  const send = sinon.stub()
  send.onFirstCall().resolves({status: 'error', error: 'Server failed'})
  send.resolves({})
  const json = createJson(send)

  const adapter = couchdb(json)
  await adapter.send(request)

  t.is(send.callCount, 2)
  t.is(typeof send.args[1][0].data._rev, 'undefined')
})

test('should set rev for more items', async (t) => {
  const request = {
    action: 'SET',
    endpoint: {
      uri: 'http://some.couchdb.com/_bulk_update',
      revUri: 'http://some.couchdb.com/_all_docs'
    },
    data: [
      {id: 'ent1', type: 'entry'},
      {id: 'ent3', type: 'entry'},
      {id: 'ent2', type: 'entry'}
    ]
  }
  const send = sinon.stub()
  send.onFirstCall().resolves({
    status: 'ok',
    data: {rows: [
      {id: 'ent1', value: {rev: '2-rev'}},
      {id: 'ent3', value: {rev: '5-rev'}},
      {id: 'ent2', value: {rev: '1-rev'}}
    ]}
  })
  send.resolves({})
  const json = createJson(send)
  const expectedReq = {
    endpoint: {
      uri: 'http://some.couchdb.com/_all_docs',
      method: 'POST',
      path: [{prop: 'rows', type: 'all', spread: true}]
    },
    data: {keys: ['ent1', 'ent3', 'ent2']},
    ident: {root: true}
  }
  const expectedData = [
    {_id: 'ent1', type: 'entry', _rev: '2-rev'},
    {_id: 'ent3', type: 'entry', _rev: '5-rev'},
    {_id: 'ent2', type: 'entry', _rev: '1-rev'}
  ]

  const adapter = couchdb(json)
  await adapter.send(request)

  t.is(send.callCount, 2)
  t.deepEqual(send.args[0][0], expectedReq)
  t.deepEqual(send.args[1][0].data, expectedData)
})

test('should set rev in headers when deleting one', async (t) => {
  const request = {
    action: 'DELETE',
    endpoint: {
      uri: 'http://some.couchdb.com/entry:ent1',
      revUri: 'http://some.couchdb.com/_all_docs',
      method: 'DELETE'
    },
    headers: {},
    params: {id: 'ent1', type: 'entry'}
  }
  const send = sinon.stub()
  send.onFirstCall().resolves({
    status: 'ok',
    data: {rows: [{id: 'ent1', value: {rev: '2-rev'}}]}
  })
  send.resolves({})
  const json = createJson(send)
  const expectedHeaders = {
    'If-Match': '2-rev'
  }

  const adapter = couchdb(json)
  await adapter.send(request)

  t.is(send.callCount, 2)
  t.deepEqual(send.args[1][0].headers, expectedHeaders)
  t.is(typeof send.args[1][0].data, 'undefined')
})

test('should not set rev in headers when no rev', async (t) => {
  const request = {
    action: 'DELETE',
    endpoint: {
      uri: 'http://some.couchdb.com/entry:ent1',
      revUri: 'http://some.couchdb.com/_all_docs',
      method: 'DELETE'
    },
    headers: {},
    params: {id: 'ent1', type: 'entry'}
  }
  const send = sinon.stub()
  send.onFirstCall().resolves({
    status: 'ok',
    data: [{key: 'ent1', error: 'not_found'}]
  })
  send.resolves({})
  const json = createJson(send)

  const adapter = couchdb(json)
  await adapter.send(request)

  t.is(send.callCount, 2)
  t.deepEqual(send.args[1][0].headers, {})
  t.is(typeof send.args[1][0].data, 'undefined')
})

test('should set existing attributes for meta', async (t) => {
  const lastSyncedAtOld = new Date('2017-05-22T19:12:00.000Z')
  const lastSyncedAt = new Date('2017-05-23T18:43:00.000Z')
  const request = {
    action: 'SET',
    endpoint: {
      uri: 'http://some.couchdb.com/entry:ent1',
      revUri: 'http://some.couchdb.com/_all_docs',
      method: 'PUT'
    },
    headers: {},
    data: {id: 'meta:entries', type: 'meta', attributes: {lastSyncedAt}}
  }
  const send = sinon.stub()
  send.onFirstCall().resolves({
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
  send.resolves({})
  const json = createJson(send)
  const expectedReq = {
    endpoint: {
      uri: 'http://some.couchdb.com/_all_docs?include_docs=true',
      method: 'POST',
      path: [{prop: 'rows', type: 'all', spread: true}]
    },
    data: {keys: ['meta:entries']},
    ident: {root: true}
  }
  const expectedData = {
    _id: 'meta:entries',
    _rev: '2-rev',
    type: 'meta',
    attributes: {lastSyncedAt, readOnly: true}
  }

  const adapter = couchdb(json)
  await adapter.send(request)

  t.is(send.callCount, 2)
  t.deepEqual(send.args[0][0], expectedReq)
  t.deepEqual(send.args[1][0].data, expectedData)
})

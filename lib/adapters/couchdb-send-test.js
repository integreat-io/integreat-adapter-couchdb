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

test('should set rev in headers when deleting one', async (t) => {
  const request = {
    action: 'DELETE',
    endpoint: {
      uri: 'http://some.couchdb.com/entry:ent1',
      revUri: 'http://some.couchdb.com/_all_docs',
      method: 'DELETE'
    },
    headers: {},
    params: { id: 'ent1', type: 'entry' }
  }
  const send = sinon.stub()
  send.onFirstCall().resolves({
    status: 'ok',
    data: { rows: [{ id: 'ent1', value: { rev: '2-rev' } }] }
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
    params: { id: 'ent1', type: 'entry' }
  }
  const send = sinon.stub()
  send.onFirstCall().resolves({
    status: 'ok',
    data: [{ key: 'ent1', error: 'not_found' }]
  })
  send.resolves({})
  const json = createJson(send)

  const adapter = couchdb(json)
  await adapter.send(request)

  t.is(send.callCount, 2)
  t.deepEqual(send.args[1][0].headers, {})
  t.is(typeof send.args[1][0].data, 'undefined')
})

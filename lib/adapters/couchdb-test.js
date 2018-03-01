import test from 'ava'
import sinon from 'sinon'

import couchdb from './couchdb'

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

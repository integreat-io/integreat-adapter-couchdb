import test from 'ava'
import nock from 'nock'
import integreat from 'integreat'

import couchdb from '..'

// Helpers

const sources = [{
  id: 'store',
  adapter: 'json',
  baseUri: 'http://test.api',
  endpoints: {
    getOne: '/{id}',
    setOne: '/{id}',
    getRevs: {uri: '/_all_docs{?keys=ids|wrap([, ", ", ]),include_docs=includeDocs?}', path: 'rows[]'}
  },
  mappings: {
    '*': {}
  },
  beforeSerialize: 'couchdb-beforeSerialize',
  afterNormalize: 'couchdb-afterNormalize'
}]

const datatypes = [{
  id: 'article',
  source: 'store',
  attributes: {
    title: 'string'
  }
}]

test.after((t) => {
  nock.restore()
})

const defs = {sources, datatypes}

// Tests

test('should retrieve from couchdb', async (t) => {
  nock('http://test.api')
    .get('/article1')
      .reply(200, {_id: 'article1', type: 'article'})
  const resources = couchdb(integreat.resources())
  const great = integreat(defs, resources)
  const action = {type: 'GET_ONE', payload: {id: 'article1', type: 'article'}}

  const ret = await great.dispatch(action)

  t.truthy(ret.data)
  t.is(ret.data.id, 'article1')
})

test('should send to couchdb', async (t) => {
  const scope = nock('http://test.api')
    .put('/article2', (body) => body._id === 'article2')
      .reply(201, {_id: 'article2', _rev: '1-8371734'})
  const resources = couchdb(integreat.resources())
  const great = integreat(defs, resources)
  const action = {type: 'SET_ONE', payload: {data: {id: 'article2', type: 'article'}}}

  await great.dispatch(action)

  t.true(scope.isDone())
})

test('should get rev before sending to couchdb', async (t) => {
  const scope = nock('http://test.api')
    .put('/article3', (body) => body._rev === '1-8371734')
      .reply(201, {_id: 'article3', _rev: '2-3139483'})
    .get('/_all_docs')
    .query({keys: '["article3"]', include_docs: false})
      .reply(200, {rows: [{id: 'article3', key: 'article3', value: {rev: '1-8371734'}}]})
  const resources = couchdb(integreat.resources())
  const great = integreat(defs, resources)
  const action = {type: 'SET_ONE', payload: {data: {id: 'article3', type: 'article'}}}

  await great.dispatch(action)

  t.true(scope.isDone())
})

const authstrat = require('./authstrats/couchdb')
const afterNormalize = require('./hooks/couchdb-afterNormalize')
const beforeSerialize = require('./hooks/couchdb-beforeSerialize')

function couchdb (resources) {
  const authstrats = Object.assign({}, resources.authstrats, {
    couchdb: authstrat
  })

  const hooks = Object.assign({}, resources.hooks, {
    'couchdb-afterNormalize': afterNormalize,
    'couchdb-beforeSerialize': beforeSerialize
  })

  return Object.assign({}, resources, {authstrats, hooks})
}

module.exports = couchdb

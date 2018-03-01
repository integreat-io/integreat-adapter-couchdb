const authstrat = require('./authstrats/couchdb')
const adapter = require('./adapters/couchdb')

function couchdb (resources) {
  const authstrats = {
    ...resources.authstrats,
    couchdb: authstrat
  }

  if (!resources.adapters || !resources.adapters.json) {
    throw new TypeError('The couchdb adapter needs the json adapter to work')
  }

  const adapters = {
    ...resources.adapters,
    couchdb: adapter(resources.adapters.json)
  }

  return {
    ...resources,
    authstrats,
    adapters
  }
}

module.exports = couchdb

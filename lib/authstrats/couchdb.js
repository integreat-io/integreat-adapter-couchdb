const authenticate = require('./authenticate')
const getAuthObject = require('./getAuthObject')
const getAuthHeaders = require('./getAuthHeaders')

/**
 * Create an instance of the couchdb strategy. Will retrieve an an
 * authentication cookie and send the cookie with every request.
 * @param {Object} options - Options object
 * @returns {Object} Strategy object
 */
function couchdbAuth ({uri, key, secret} = {}) {
  return {
    /**
     * Check whether we've already ran authentication.
     * @returns {boolean} `true` if already authenticated, otherwise `false`
     */
    isAuthenticated () {
      return !!this._cookie
    },

    /**
     * Authenticate and return true if authentication was successful.
     * @returns {Promise} Promise of authentication success or failure (true/false)
     */
    async authenticate () {
      return authenticate.call(this, {uri, key, secret})
    },

    /**
     * Return an object with the information needed for authenticated requests
     * with this strategy.
     * @returns {Object} Auth object
     */
    getAuthObject () {
      return getAuthObject.call(this)
    },

    /**
     * Return a headers object with the headers needed for authenticated requests
     * with this strategy.
     * @returns {Object} Headers object
     */
    getAuthHeaders () {
      return getAuthHeaders.call(this)
    }
  }
}

module.exports = couchdbAuth

const prepareEndpoint = require('./prepareEndpoint')
const send = require('./send')
const serializeData = require('./serializeData')
const normalizeData = require('./normalizeData')

/**
 * Wrap json adapter to provide adjustments for couchdb.
 * @param {Object} json - The json adapter
 * @returns {Object} The couchdb adapter
 */
function couchdb (json) {
  return {
    prepareEndpoint (endpointOptions, sourceOptions) {
      return prepareEndpoint(json, endpointOptions, sourceOptions)
    },

    async send (request) {
      return send(json, request)
    },

    async serialize (data, request) {
      const serializedData = await serializeData(data, request, json)
      return json.serialize(serializedData, request)
    },

    async normalize (data, request) {
      const normalizedData = await json.normalize(data, request)
      return normalizeData(normalizedData)
    }
  }
}

module.exports = couchdb

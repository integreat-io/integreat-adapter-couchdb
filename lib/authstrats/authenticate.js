const request = require('request-promise-native')
const debug = require('debug')('great:auth')

async function authenticate ({ uri, key, secret }, auth) {
  const options = {
    url: `${uri}/_session`,
    method: 'POST',
    body: `name=${key}&password=${secret}`,
    resolveWithFullResponse: true,
    simple: false,
    json: true,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }

  try {
    const { body, statusCode, headers } = await request(options)

    if (statusCode === 200 && body && body.ok) {
      this._cookie = headers['set-cookie']
      return true
    } else {
      debug(`Couchdb auth: Could not authenticate '${key}' on ${uri}`)
    }
  } catch (error) {
    debug(`Couchdb auth: Server returned an error. ${error}`)
  }

  return false
}

module.exports = authenticate

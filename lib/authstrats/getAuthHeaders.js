function getAuthHeaders () {
  if (this._cookie) {
    return {
      'Cookie': this._cookie
    }
  }
  return {}
}

module.exports = getAuthHeaders

function getAuthObject () {
  if (this._cookie) {
    const match = /AuthSession="([^"]+)"/.exec(this._cookie)
    return (match && match[1]) ? { authSession: match[1] } : {}
  }
  return {}
}

module.exports = getAuthObject

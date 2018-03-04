const getRevUri = (data, endpoint) =>
  (data && [].concat(data).some((item) => item.type === 'meta'))
    ? endpoint.revUri + '?include_docs=true'
    : endpoint.revUri

async function getRev (data, {endpoint = {}, params, auth}, adapter) {
  const keys = (data)
    ? [].concat(data).map((item) => item.id)
    : params.id && [params.id]

  const uri = getRevUri(data, endpoint)

  if (endpoint.revUri) {
    const response = await adapter.send({
      endpoint: {
        uri,
        method: 'POST',
        path: [{prop: 'rows', type: 'all', spread: true}]
      },
      data: {keys},
      auth,
      ident: {root: true}
    })
    return (response.data && response.data.rows) || []
  }

  return []
}

module.exports = getRev

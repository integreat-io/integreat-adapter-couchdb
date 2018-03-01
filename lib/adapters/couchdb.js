const prepareRequestItem = ({action}, revArray) => ({id, type, ...rest}, index) => {
  const item = {...rest, type, _id: id}

  if (revArray[index]) {
    item._rev = revArray[index].value && revArray[index].value.rev

    if (type === 'meta' && revArray[index].doc && revArray[index].doc.attributes) {
      item.attributes = {
        ...revArray[index].doc.attributes,
        ...item.attributes
      }
    }
  }

  if (action === 'DELETE') {
    item._deleted = true
  }

  return item
}

const getRev = async ({endpoint, params, data}, adapter) => {
  const keys = (data)
    ? [].concat(data).map((item) => item.id)
    : params.id && [params.id]

  const uri = (data && [].concat(data).some((item) => item.type === 'meta'))
    ? endpoint.revUri + '?include_docs=true'
    : endpoint.revUri

  if (endpoint.revUri) {
    const response = await adapter.send({
      endpoint: {
        uri,
        method: 'POST',
        path: [{prop: 'rows', type: 'all', spread: true}]
      },
      data: {keys},
      ident: {root: true}
    })
    return (response.data && response.data.rows) || []
  }

  return []
}

const prepareRequest = async (request, adapter) => {
  const {data, endpoint = {}} = request

  if (data || endpoint.method === 'DELETE') {
    const revResponse = await getRev(request, adapter)

    if (data) {
      const preparedData = (Array.isArray(data))
        ? data.map(prepareRequestItem(request, revResponse))
        : prepareRequestItem(request, revResponse)(data, 0)
      return {...request, data: preparedData}
    }

    if (revResponse.length > 0 && revResponse[0].value) {
      return {
        ...request,
        headers: {'If-Match': revResponse[0].value.rev}
      }
    }
  }

  return request
}

const prepareResponseItem = (item) => {
  if (!item) {
    return item
  }

  const {_id, ...rest} = item
  return (_id) ? {...rest, id: _id} : item
}

function prepareResponse (response) {
  const {data} = response

  if (!data) {
    return response
  }

  const preparedData = (Array.isArray(data))
    ? data.map(prepareResponseItem)
    : prepareResponseItem(data)

  return {...response, data: preparedData}
}

/**
 * Wrap json adapter to provide adjustments for couchdb.
 * @param {Object} json - The json adapter
 * @returns {Object} The couchdb adapter
 */
function couchdb (json) {
  return {
    normalize: json.normalize,
    serialize: json.serialize,

    prepareEndpoint (endpointOptions, sourceOptions) {
      const endpoint = json.prepareEndpoint(endpointOptions, sourceOptions)

      if (sourceOptions) {
        const {baseUri} = sourceOptions
        const revUri = (baseUri)
          ? [`${baseUri}${(baseUri.endsWith('/')) ? '' : '/'}_all_docs`]
          : null
        return {...endpoint, revUri}
      }

      return endpoint
    },

    async send (request) {
      const preparedRequest = await prepareRequest(request, json)

      const response = await json.send(preparedRequest)

      return prepareResponse(response)
    }
  }
}

module.exports = couchdb

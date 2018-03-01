const getRev = async (data, {endpoint = {}, params, auth}, adapter) => {
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
      auth,
      ident: {root: true}
    })
    return (response.data && response.data.rows) || []
  }

  return []
}

const serializeItem = ({action}, revArray) => ({id, type, ...rest}, index) => {
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

const serializeData = async (data, request, adapter) => {
  if (!data) {
    return data
  }

  const revResponse = await getRev(data, request, adapter)

  return (Array.isArray(data))
    ? data.map(serializeItem(request, revResponse))
    : serializeItem(request, revResponse)(data, 0)
}

const normalizeItem = (item) => {
  if (!item) {
    return item
  }

  const {_id, ...rest} = item
  return (_id) ? {...rest, id: _id} : item
}

function normalizeData (data) {
  if (!data) {
    return data
  }

  return (Array.isArray(data))
    ? data.map(normalizeItem)
    : normalizeItem(data)
}

/**
 * Wrap json adapter to provide adjustments for couchdb.
 * @param {Object} json - The json adapter
 * @returns {Object} The couchdb adapter
 */
function couchdb (json) {
  return {
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
      const {data, endpoint = {}} = request
      let {headers} = request

      if (!data && endpoint.method === 'DELETE') {
        const revResponse = await getRev(data, request, json)

        if (revResponse.length > 0 && revResponse[0].value) {
          headers = {
            ...headers,
            'If-Match': revResponse[0].value.rev
          }
        }
      }

      return json.send({...request, headers})
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

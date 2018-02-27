const prepareItem = (revArray, {action}) => (item, index) => {
  if (revArray && revArray.length > index && revArray[index]) {
    if (revArray[index].value) {
      item._rev = revArray[index].value.rev
    }

    if (item.type === 'meta' && revArray[index].doc && revArray[index].doc.attributes) {
      const oldAttrs = revArray[index].doc.attributes
      Object.keys(oldAttrs).forEach((key) => {
        if (!item.attributes.hasOwnProperty(key)) {
          item.attributes[key] = oldAttrs[key]
        }
      })
    }
  }

  item._id = item.id
  delete item.id

  if (action === 'DELETE') {
    item._deleted = true
  }
}

async function beforeSerialize (request, {source}) {
  const {data, method, headers, params} = request
  let keys
  let includeDocs = false
  if (data) {
    keys = [].concat(data).map((item) => item.id)
    includeDocs = [].concat(data).some((item) => item.type === 'meta')
  } else {
    keys = [params.id]
  }
  const revResponse = await source.retrieve(source.prepareRequest({
    endpoint: 'getRevs',
    params: {includeDocs},
    data: {keys},
    ident: {root: true}
  }))

  if (Array.isArray(data)) {
    data.forEach(prepareItem(revResponse.data, request))
  } else if (method === 'DELETE') {
    if (revResponse.data && revResponse.data.length > 0 && revResponse.data[0].value) {
      headers['If-Match'] = revResponse.data[0].value.rev
    }
  } else if (data) {
    prepareItem(revResponse.data, request)(data, 0)
  }
}

module.exports = beforeSerialize

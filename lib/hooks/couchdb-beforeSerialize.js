const prepareItem = (revArray) => (item, index) => {
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

  if (item.hasOwnProperty('delete')) {
    item._deleted = item.delete
    delete item.delete
  }
}

async function beforeSerialize (request, {source}) {
  const {data, method, headers, params} = request
  let ids
  let includeDocs = false
  if (data) {
    ids = [].concat(data).map((item) => item.id)
    includeDocs = [].concat(data).some((item) => item.type === 'meta')
  } else {
    ids = [params.id]
  }
  const revResponse = await source.retrieveNormalized({endpoint: 'getRevs', params: {ids, includeDocs}})

  if (Array.isArray(data)) {
    data.forEach(prepareItem(revResponse.data))
  } else if (method === 'DELETE') {
    if (revResponse.data && revResponse.data.length > 0 && revResponse.data[0].value) {
      headers['If-Match'] = revResponse.data[0].value.rev
    }
  } else {
    prepareItem(revResponse.data)(data, 0)
  }
}

module.exports = beforeSerialize

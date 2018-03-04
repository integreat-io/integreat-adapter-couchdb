const getRev = require('./getRev')

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

async function serializeData (data, request, adapter) {
  if (!data) {
    return data
  }

  const revResponse = await getRev(data, request, adapter)

  return (Array.isArray(data))
    ? data.map(serializeItem(request, revResponse))
    : serializeItem(request, revResponse)(data, 0)
}

module.exports = serializeData

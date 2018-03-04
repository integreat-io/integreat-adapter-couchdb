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

module.exports = normalizeData

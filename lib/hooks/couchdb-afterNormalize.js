const prepareItem = (item) => {
  item.id = item._id
  delete item._id
}

async function afterNormalize (response, {source}) {
  const {data} = response
  if (data) {
    if (Array.isArray(data)) {
      data.forEach(prepareItem)
    } else {
      prepareItem(data)
    }
  }
}

module.exports = afterNormalize

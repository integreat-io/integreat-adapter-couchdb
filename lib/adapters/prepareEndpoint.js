const generateRevUri = (baseUri) => (baseUri)
  ? [`${baseUri}${(baseUri.endsWith('/')) ? '' : '/'}_all_docs`]
  : null

function prepareEndpoint (json, endpointOptions, sourceOptions) {
  const endpoint = json.prepareEndpoint(endpointOptions, sourceOptions)

  if (sourceOptions) {
    const revUri = generateRevUri(sourceOptions.baseUri)
    return {...endpoint, revUri}
  }

  return endpoint
}

module.exports = prepareEndpoint

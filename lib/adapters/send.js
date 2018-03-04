const getRev = require('./getRev')

async function send (json, request) {
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
}

module.exports = send

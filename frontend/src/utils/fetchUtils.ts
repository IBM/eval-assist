export const get = async (path: string) => {
  return await makeRequest(path, 'GET', undefined)
}

export const post = async (path: string, body: any) => {
  return await makeRequest(path, 'POST', body)
}

export const deleteCustom = async (path: string) => {
  return await makeRequest(path, 'DELETE')
}

export const put = async (path: string, body: any) => {
  return await makeRequest(path, 'PUT', body)
}

const makeRequest = async (path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any) => {
  const isFormData = body instanceof FormData
  const contentType = 'application/json'
  return await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_HOST}/${path}/`, {
    headers: isFormData
      ? // content type has to be undefined when sending files
        // see https://stackoverflow.com/questions/39280438/fetch-missing-boundary-in-multipart-form-data-post?rq=4
        undefined
      : {
          'Content-Type': contentType,
        },
    method: method,
    body: method === 'POST' || method === 'PUT' ? (isFormData ? body : JSON.stringify(body)) : undefined,
  }).then((r) => r)
}

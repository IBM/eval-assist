export const get = async (path: string) => {
  return await makeRequest(path, 'GET', undefined)
}

export const post = async (path: string, body: any, custom_headers?: { [key: string]: any }) => {
  return await makeRequest(path, 'POST', body, custom_headers)
}

export const deleteCustom = async (path: string, body?: any) => {
  return await makeRequest(path, 'DELETE', body)
}

export const put = async (path: string, body: any) => {
  return await makeRequest(path, 'PUT', body)
}

const makeRequest = async (
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: any,
  custom_headers?: { [key: string]: any },
) => {
  const isFormData = body instanceof FormData
  const contentType = 'application/json'
  const headers = custom_headers ?? {}

  if (!isFormData) {
    headers['Content-Type'] = contentType
  }

  return await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_HOST}/${path}`, {
    headers,
    method: method,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  }).then((r) => r)
}

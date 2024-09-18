import { useCallback } from 'react'

import { useBackendUserContext } from '@components/SingleExampleEvaluation/Providers/BackendUserProvider'

export const useFetchUtils = () => {
  const { backendUser } = useBackendUserContext()
  const makeRequest = useCallback(
    async (path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any) => {
      const isFormData = body instanceof FormData
      const contentType = 'application/json'
      const headers: { [key: string]: any } = {}
      if (backendUser) {
        headers['user_id'] = backendUser.id
      }
      if (!isFormData) {
        headers['Content-Type'] = contentType
      }

      return await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_HOST}/${path}`, {
        headers,
        method: method,
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      }).then((r) => r)
    },
    [backendUser],
  )

  const get = useCallback(
    async (path: string) => {
      return await makeRequest(path, 'GET', undefined)
    },
    [makeRequest],
  )

  const post = useCallback(
    async (path: string, body: any) => {
      return await makeRequest(path, 'POST', body)
    },
    [makeRequest],
  )

  const deleteCustom = useCallback(
    async (path: string, body?: any) => {
      return await makeRequest(path, 'DELETE', body)
    },
    [makeRequest],
  )

  const put = useCallback(
    async (path: string, body: any) => {
      return await makeRequest(path, 'PUT', body)
    },
    [makeRequest],
  )

  return {
    get,
    post,
    deleteCustom,
    put,
  }
}

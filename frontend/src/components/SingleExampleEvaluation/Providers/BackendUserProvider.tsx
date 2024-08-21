import { ReactNode, createContext, useContext, useEffect, useState } from 'react'

import { Loading } from '@carbon/react'

import { useAuthentication } from '@customHooks/useAuthentication'
import { useFetchUtils } from '@customHooks/useFetchUtils'
import { AppUser } from '@prisma/client'

interface BackendUserContextValue {
  backendUser: AppUser | null
  fetchingBackendUser: boolean
}

const BackendUserContext = createContext<BackendUserContextValue>({
  backendUser: null,
  fetchingBackendUser: false,
})

export const useBackendUserContext = () => {
  return useContext(BackendUserContext)
}

export const BackendUserProvider = ({ children }: { children: ReactNode }) => {
  const [fetchingBackendUser, setFetchingBackendUser] = useState(false)
  const { user, authenticationEnabled, defaultUserName } = useAuthentication()
  const [backendUser, setBackendUser] = useState<AppUser | null>(null)
  const { post } = useFetchUtils()

  useEffect(() => {
    const createUserIfNotExist = async () => {
      setFetchingBackendUser(true)
      if (user) {
        const data = { name: user.name, email: user.email }
        post('user/', data).then((res) => {
          if (res.ok) {
            res.json().then((userInfo) => {
              setBackendUser(userInfo)
            })
          }
          setFetchingBackendUser(false)
        })
      } else {
        if (!authenticationEnabled) {
          setBackendUser({
            id: -1,
            name: defaultUserName,
            email: defaultUserName,
          })
          setFetchingBackendUser(false)
        }
      }
    }
    createUserIfNotExist()
    // eslint-disable-next-line
  }, [JSON.stringify(user)])

  if (fetchingBackendUser || backendUser === null) return <Loading withOverlay />

  return (
    <BackendUserContext.Provider
      value={{
        backendUser,
        fetchingBackendUser,
      }}
    >
      {children}
    </BackendUserContext.Provider>
  )
}

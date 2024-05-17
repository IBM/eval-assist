import { useEffect, useState } from 'react'

import { NextComponentType } from 'next'

import { Loading } from '@carbon/react'

import { LoginView } from '@components/Login/Login'
import { useAuthentication } from '@customHooks/useAuthentication'
import { useHasMounted } from '@customHooks/useHasMounted'
import { post } from '@utils/fetchUtils'

export const withAuth = (Component: NextComponentType) => {
  const Auth = () => {
    // Login data added to props via redux-store (or use react context for example)
    const { user, authenticationEnabled, isUnauthenticated, authenticationLoading } = useAuthentication()
    const [checkingBackendUser, setCheckingBackendUser] = useState(false)
    const [backendUserId, setBackendUserId] = useState<number | null | 'error'>(null)

    useEffect(() => {
      const createUserIfNotExist = async () => {
        setCheckingBackendUser(true)
        if (user) {
          const data = { name: user.name, email: user.email }
          post('user/', data).then((res) => {
            if (res.ok) {
              res.json().then((userInfo) => {
                setBackendUserId(backendUserId)
              })
            } else {
              console.log('withAuth res is not OK!')
              setBackendUserId('error')
            }
            setCheckingBackendUser(false)
          })
        }
      }
      if (authenticationEnabled) {
        createUserIfNotExist()
      }
      // eslint-disable-next-line
    }, [JSON.stringify(user)])

    if (authenticationEnabled) {
      if (authenticationLoading) return <Loading withOverlay />

      // If user is not logged in, return login component
      if (isUnauthenticated) return <LoginView />

      if (checkingBackendUser) return <Loading withOverlay />
    }

    // If user is logged in, return original component
    return <Component />
  }

  return Auth
}

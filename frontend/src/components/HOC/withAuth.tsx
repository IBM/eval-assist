import { useEffect, useState } from 'react'

import { NextComponentType } from 'next'

import { Loading } from '@carbon/react'

import { LoginView } from '@components/Login/Login'
import { useAuthentication } from '@customHooks/useAuthentication'
import { post } from '@utils/fetchUtils'

export const withAuth = (Component: NextComponentType) => {
  const Auth = () => {
    // Login data added to props via redux-store (or use react context for example)
    const { authenticationEnabled, isLoggedIn, user } = useAuthentication()
    const [userIsCreated, setUserIsCreated] = useState(!!!authenticationEnabled)

    useEffect(() => {
      const createUserIfNotExist = async () => {
        if (user) {
          post('user', { user: user.name }).then((res) => {
            if (res.ok) {
              res.json().then((userInfo) => {
                setUserIsCreated(true)
              })
            }
          })
        }
      }

      createUserIfNotExist()
    }, [user])

    // If user is not logged in, return login component
    if (!isLoggedIn) return <LoginView />

    if (!userIsCreated) return <Loading withOverlay />

    // If user is logged in, return original component
    return <Component />
  }

  return Auth
}

import { NextComponentType } from 'next'

import { Loading } from '@carbon/react'

import { LoginView } from '@components/Login/Login'
import { useBackendUserContext } from '@components/SingleExampleEvaluation/Providers/BackendUserProvider'
import { useAuthentication } from '@customHooks/useAuthentication'

export const withAuth = (Component: NextComponentType) => {
  const Auth = () => {
    // Login data added to props via redux-store (or use react context for example)
    const { authenticationEnabled, isUnauthenticated, authenticationLoading } = useAuthentication()
    const { fetchingBackendUser } = useBackendUserContext()

    if (authenticationEnabled) {
      if (authenticationLoading) return <Loading withOverlay />

      // If user is not logged in, return login component
      if (isUnauthenticated) return <LoginView />

      if (fetchingBackendUser) return <Loading withOverlay />
    }

    // If user is logged in, return original component
    return <Component />
  }

  return Auth
}

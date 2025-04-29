import { Loading } from '@carbon/react'

import { LoginView } from '@components/Login/Login'
import { useAuthentication } from '@customHooks/useAuthentication'

export const withAuth = (Component: any) => {
  const Auth = () => {
    // Login data added to props via redux-store (or use react context for example)
    const { authenticationEnabled, isUnauthenticated, authenticationLoading } = useAuthentication()

    if (authenticationEnabled) {
      if (authenticationLoading) return <Loading withOverlay />
      // If user is not logged in, return login component
      if (isUnauthenticated) return <LoginView />
    }

    // If user is logged in, return original component
    return <Component />
  }

  return Auth
}

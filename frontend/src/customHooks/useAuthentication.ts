import { useCallback, useMemo } from 'react'

import { useSession } from 'next-auth/react'

export const useAuthentication = () => {
  const { data: session, status } = useSession()
  const user = useMemo(() => session?.user, [session])

  const authenticationEnabled = useMemo(() => process.env.NEXT_PUBLIC_USE_AUTH === 'true', [])

  const isAuthenticated = status === 'authenticated'

  const authenticationLoading = status === 'loading'

  const isUnauthenticated = status === 'unauthenticated'

  const defaultUserName = 'only_dev_default_user'

  const getUserName = useCallback(
    () => (authenticationEnabled ? (user?.email as string) : defaultUserName),
    [authenticationEnabled, user?.email],
  )

  return {
    authenticationEnabled,
    isAuthenticated,
    user,
    getUserName,
    authenticationLoading,
    isUnauthenticated,
    defaultUserName,
  }
}

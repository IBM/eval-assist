import { useCallback, useMemo } from 'react'

import { useSession } from 'next-auth/react'

export const useAuthentication = () => {
  const { data: session, status } = useSession()

  const user = useMemo(() => session?.user, [session])

  const authenticationEnabled = useMemo(() => process.env.NEXT_PUBLIC_USE_AUTH === 'true', [])

  const isAuthenticated = useMemo(() => status === 'authenticated', [status])

  const isLoggedIn = useMemo(() => !authenticationEnabled || isAuthenticated, [authenticationEnabled, isAuthenticated])

  const getUserName = useCallback(
    () => (authenticationEnabled ? (user?.name as string) : 'only_dev_default_user'),
    [authenticationEnabled, user?.name],
  )

  return {
    authenticationEnabled,
    isAuthenticated,
    isLoggedIn,
    user,
    getUserName,
  }
}

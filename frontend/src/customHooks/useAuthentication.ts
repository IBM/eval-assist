import { useMemo } from 'react'

import { useSession } from 'next-auth/react'

export const useAuthentication = () => {
  const { data: session, status } = useSession()

  const user = useMemo(() => session?.user, [session])

  const authenticationEnabled = useMemo(() => process.env.NEXT_PUBLIC_USE_AUTH === 'true', [])

  const isAuthenticated = useMemo(() => status === 'authenticated', [status])

  return {
    authenticationEnabled,
    isAuthenticated,
    user,
  }
}

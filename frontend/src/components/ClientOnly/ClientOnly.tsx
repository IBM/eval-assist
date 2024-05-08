import { ReactNode, useEffect, useState } from 'react'

import { useHasMounted } from '@customHooks/useHasMounted'

interface Props {
  children: ReactNode
}

export const ClientOnly = ({ children }: Props) => {
  const hasMounted = useHasMounted()

  if (!hasMounted) {
    return null
  }

  return children
}

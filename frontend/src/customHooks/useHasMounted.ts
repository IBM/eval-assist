import React from 'react'

// used in components that use hooks that
// conflict with react hydration like useSessionStorage
export const useHasMounted = () => {
  const [hasMounted, setHasMounted] = React.useState(false)
  React.useEffect(() => {
    setHasMounted(true)
  }, [])
  return hasMounted
}

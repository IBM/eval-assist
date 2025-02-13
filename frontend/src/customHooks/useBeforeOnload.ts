import { useEffect } from 'react'

export const useBeforeOnload = (changesDetected: boolean) => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!changesDetected) {
        return false
      } else {
        // Perform actions before the component unloads
        event.preventDefault()
        return true
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [changesDetected])
}

import { ReactNode, createContext, useContext, useEffect, useState } from 'react'

import { Loading } from '@carbon/react'

import { useFetchUtils } from '@customHooks/useFetchUtils'

interface FeatureFlags {
  useAuth: boolean
  useStorage: boolean
}

const defaultFeatureFlags = {
  useAuth: false,
  useStorage: true,
}

const FeatureFlagsContext = createContext<FeatureFlags>(defaultFeatureFlags)

export const useFeatureFlags = () => {
  return useContext(FeatureFlagsContext)
}

export const FeatureFlagsProvider = ({ children }: { children: ReactNode }) => {
  const [fetchingFeatureFlags, setFetchingFeatureFlags] = useState(false)
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null)
  const { get } = useFetchUtils()

  useEffect(() => {
    const fetchFeatureFlags = async () => {
      setFetchingFeatureFlags(true)
      try {
        const response = await get('feature-flags/')
        if (response.ok) {
          const flags = await response.json()
          setFeatureFlags({
            useAuth: flags.use_auth,
            useStorage: flags.use_storage,
          })
        } else {
          console.error('Failed to fetch feature flags')
        }
      } catch (error) {
        console.error('Error fetching feature flags:', error)
      } finally {
        setFetchingFeatureFlags(false)
      }
    }

    fetchFeatureFlags()
  }, [get])

  if (fetchingFeatureFlags || !featureFlags) return <Loading withOverlay />

  return <FeatureFlagsContext.Provider value={featureFlags}>{children}</FeatureFlagsContext.Provider>
}

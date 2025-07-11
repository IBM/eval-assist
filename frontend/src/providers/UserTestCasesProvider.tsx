import { Dispatch, ReactNode, SetStateAction, createContext, useContext, useEffect, useState } from 'react'

import { Loading } from '@carbon/react'

import { useAuthentication } from '@customHooks/useAuthentication'
import { useFetchUtils } from '@customHooks/useFetchUtils'
import { useParseFetchedUseCase } from '@customHooks/useParseFetchedUseCase'

import { FetchedTestCase, TestCase } from '../types'
import { useFeatureFlags } from './FeatureFlagsProvider'

interface UserTestCasesContextValue {
  userTestCases: TestCase[]
  setUserTestCases: Dispatch<SetStateAction<TestCase[]>>
}

const UserTestCasesContext = createContext<UserTestCasesContextValue>({
  userTestCases: [],
  setUserTestCases: () => {},
})

export const useUserTestCasesContext = () => {
  return useContext(UserTestCasesContext)
}

export const UserTestCasesProvider = ({ children }: { children: ReactNode }) => {
  const [loadingTestCases, setLoadingTestCases] = useState(false)
  const [userTestCases, setUserTestCases] = useState<TestCase[] | null>(null)
  const { getUserName } = useAuthentication()
  const { storageEnabled } = useFeatureFlags()
  const { get } = useFetchUtils()
  const { parseFetchedUseCase } = useParseFetchedUseCase()
  useEffect(() => {
    const fetchTestCases = async () => {
      setLoadingTestCases(true)
      const fetchedUserTestCases: FetchedTestCase[] = await (
        await get(`test_case/?user=${encodeURIComponent(getUserName())}`)
      ).json()
      const parsedFetchedUserTestCases = fetchedUserTestCases
        .map((testCase) => parseFetchedUseCase(testCase))
        .filter((testCase) => testCase !== null) as TestCase[]
      setUserTestCases(parsedFetchedUserTestCases)
      setLoadingTestCases(false)
    }
    if (storageEnabled) {
      fetchTestCases()
    } else {
      setUserTestCases([])
    }
  }, [get, getUserName, parseFetchedUseCase, storageEnabled])

  if (loadingTestCases || userTestCases === null) return <Loading withOverlay />

  return (
    <UserTestCasesContext.Provider
      value={{
        userTestCases,
        setUserTestCases: setUserTestCases as Dispatch<SetStateAction<TestCase[]>>,
      }}
    >
      {children}
    </UserTestCasesContext.Provider>
  )
}

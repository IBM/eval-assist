import { Dispatch, ReactNode, SetStateAction, createContext, useContext, useEffect, useState } from 'react'

import { Loading } from '@carbon/react'

import { useAuthentication } from '@customHooks/useAuthentication'
import { useFetchUtils } from '@customHooks/useFetchUtils'
import { useParseFetchedUseCase } from '@customHooks/useParseFetchedUseCase'
import { StoredUseCase } from '@prisma/client'

import { UseCase } from '../../../types'

interface UserUseCasesContextValue {
  userUseCases: UseCase[]
  setUserUseCases: Dispatch<SetStateAction<UseCase[]>>
}

const UserUseCasesContext = createContext<UserUseCasesContextValue>({
  userUseCases: [],
  setUserUseCases: () => {},
})

export const useUserUseCasesContext = () => {
  return useContext(UserUseCasesContext)
}

export const UserUseCasesProvider = ({ children }: { children: ReactNode }) => {
  const [loadingUseCases, setLoadingUseCases] = useState(false)
  const [userUseCases, setUserUseCases] = useState<UseCase[] | null>(null)
  const { getUserName } = useAuthentication()
  const { get } = useFetchUtils()
  const { parseFetchedUseCase } = useParseFetchedUseCase()

  useEffect(() => {
    const fetchUseCases = async () => {
      setLoadingUseCases(true)
      const fetchedUserUseCases: StoredUseCase[] = await (
        await get(`use_case/?user=${encodeURIComponent(getUserName())}`)
      ).json()
      const parsedFetchedUserUseCases = fetchedUserUseCases.map((testCase) => parseFetchedUseCase(testCase))
      setUserUseCases(parsedFetchedUserUseCases)
      setLoadingUseCases(false)
    }
    fetchUseCases()
  }, [get, getUserName, parseFetchedUseCase])

  if (loadingUseCases || userUseCases === null) return <Loading withOverlay />

  return (
    <UserUseCasesContext.Provider
      value={{
        userUseCases,
        setUserUseCases: setUserUseCases as Dispatch<SetStateAction<UseCase[]>>,
      }}
    >
      {children}
    </UserUseCasesContext.Provider>
  )
}

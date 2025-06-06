import { Dispatch, ReactNode, SetStateAction, createContext, useContext, useEffect, useState } from 'react'

import { useURLParamsContext } from './URLParamsProvider'
import { useUserTestCasesContext } from './UserTestCasesProvider'

interface AppSidebarContextValue {
  sidebarTabSelected: 'user_test_cases' | 'library_test_cases' | 'risks_and_harms' | null
  setSidebarTabSelected: Dispatch<SetStateAction<'user_test_cases' | 'library_test_cases' | 'risks_and_harms' | null>>
}

const AppSidebarContext = createContext<AppSidebarContextValue>({
  sidebarTabSelected: null,
  setSidebarTabSelected: () => {},
})

export const useAppSidebarContext = () => {
  return useContext(AppSidebarContext)
}

export const AppSidebarProvider = ({ children }: { children: ReactNode }) => {
  const [sidebarTabSelected, setSidebarTabSelected] = useState<
    'user_test_cases' | 'library_test_cases' | 'risks_and_harms' | null
  >(null)
  const { useCaseId, useCaseType, libraryTestCaseName, isRisksAndHarms } = useURLParamsContext()
  const { userTestCases: userUseCases } = useUserTestCasesContext()

  useEffect(() => {
    if (useCaseId !== null && userUseCases !== null) {
      setSidebarTabSelected('user_test_cases')
    } else if (libraryTestCaseName !== null && !isRisksAndHarms) {
      setSidebarTabSelected('library_test_cases')
    } else if (isRisksAndHarms) {
      setSidebarTabSelected('risks_and_harms')
    } else {
      setSidebarTabSelected(null)
    }
  }, [useCaseId, useCaseType, libraryTestCaseName, userUseCases, isRisksAndHarms])
  return (
    <AppSidebarContext.Provider
      value={{
        sidebarTabSelected,
        setSidebarTabSelected,
      }}
    >
      {children}
    </AppSidebarContext.Provider>
  )
}

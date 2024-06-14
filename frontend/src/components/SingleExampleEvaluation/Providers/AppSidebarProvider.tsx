import { Dispatch, ReactNode, SetStateAction, createContext, useContext, useEffect, useMemo, useState } from 'react'

import { useURLInfoContext } from './URLInfoProvider'
import { useUserUseCasesContext } from './UserUseCasesProvider'

interface AppSidebarContextValue {
  sidebarTabSelected: 'user_use_cases' | 'library_use_cases' | null
  setSidebarTabSelected: Dispatch<SetStateAction<'user_use_cases' | 'library_use_cases' | null>>
}

const AppSidebarContext = createContext<AppSidebarContextValue>({
  sidebarTabSelected: null,
  setSidebarTabSelected: () => {},
})

export const useAppSidebarContext = () => {
  return useContext(AppSidebarContext)
}

export const AppSidebarProvider = ({ children }: { children: ReactNode }) => {
  const [sidebarTabSelected, setSidebarTabSelected] = useState<'user_use_cases' | 'library_use_cases' | null>(null)
  const { useCaseId, useCaseType, libraryTestCaseName } = useURLInfoContext()
  const { userUseCases } = useUserUseCasesContext()

  useEffect(() => {
    if (useCaseId !== null && userUseCases !== null) {
      setSidebarTabSelected('user_use_cases')
    } else if (libraryTestCaseName !== null) {
      setSidebarTabSelected('library_use_cases')
    } else {
      setSidebarTabSelected(null)
    }
  }, [useCaseId, useCaseType, libraryTestCaseName, userUseCases])
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

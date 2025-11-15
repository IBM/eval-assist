import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'

import { Loading } from '@carbon/react'

import { useFetchUtils } from '@customHooks/useFetchUtils'

import { EvaluationType, Evaluator, FetchedEvaluator } from '../types'

interface JudgeOptionsContextContextValue {
  judges: Record<string, string[]>
  loadingJudges: boolean
}

const JudgeOptionsContext = createContext<JudgeOptionsContextContextValue>({
  judges: {},
  loadingJudges: false,
})

export const useJudgeOptionsContext = () => {
  return useContext(JudgeOptionsContext)
}

export const JudgeOptionsProvider = ({ children }: { children: ReactNode }) => {
  const [judges, setJudges] = useState<Record<string, string[]> | null>(null)
  const [loadingJudges, setLoadingJudgesEvaluators] = useState(false)
  const { get } = useFetchUtils()

  useEffect(() => {
    const fetchData = async () => {
      setLoadingJudgesEvaluators(true)
      const judges = (await (await get('judges/')).json())['judges']
      setLoadingJudgesEvaluators(false)
      setJudges(judges)
    }
    fetchData()
  }, [get])

  if (loadingJudges || judges === null) return <Loading withOverlay />

  return (
    <JudgeOptionsContext.Provider
      value={{
        judges,
        loadingJudges,
      }}
    >
      {children}
    </JudgeOptionsContext.Provider>
  )
}

import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'

import { Loading } from '@carbon/react'

import { useFetchUtils } from '@customHooks/useFetchUtils'

import { EvaluationType, Evaluator, FetchedEvaluator } from '../../../types'

interface PipelineContextValue {
  directEvaluators: Evaluator[] | null
  pairwiseEvaluators: Evaluator[] | null
  graniteGuardianEvaluators: Evaluator[] | null
  nonGraniteGuardianEvaluators: Evaluator[] | null
  loadingEvaluators: boolean
}

const PipelineTypesContext = createContext<PipelineContextValue>({
  directEvaluators: null,
  pairwiseEvaluators: null,
  graniteGuardianEvaluators: null,
  nonGraniteGuardianEvaluators: null,
  loadingEvaluators: false,
})

export const usePipelineTypesContext = () => {
  return useContext(PipelineTypesContext)
}

export const PipelineTypesProvider = ({ children }: { children: ReactNode }) => {
  const [evaluators, setEvaluators] = useState<Evaluator[] | null>(null)
  const [loadingEvaluators, setLoadingEvaluators] = useState(false)
  const { get } = useFetchUtils()

  const directEvaluators = useMemo(
    () => evaluators?.filter((p) => p.type === EvaluationType.DIRECT) ?? null,
    [evaluators],
  )

  const pairwiseEvaluators = useMemo(
    () => evaluators?.filter((p) => p.type === EvaluationType.PAIRWISE) ?? null,
    [evaluators],
  )
  const graniteGuardianEvaluators = useMemo(
    () => directEvaluators?.filter((p) => p.name.startsWith('Granite Guardian')) || null,
    [directEvaluators],
  )

  const nonGraniteGuardianEvaluators = useMemo(
    () => directEvaluators?.filter((p) => !p.name.startsWith('Granite Guardian')) || null,
    [directEvaluators],
  )

  useEffect(() => {
    const fetchData = async () => {
      setLoadingEvaluators(true)
      const response = await get('evaluators/')
      const data = await response.json()
      setLoadingEvaluators(false)
      let evaluators: Evaluator[] = []
      data.evaluators.forEach((evaluator: FetchedEvaluator) => {
        evaluator.providers.forEach((provider) => {
          ;[EvaluationType.DIRECT, EvaluationType.PAIRWISE].forEach((type) => {
            let p = { ...evaluator, provider, type: type as EvaluationType }
            // @ts-ignore
            delete p.providers
            evaluators.push({ ...p })
          })
        })
      })
      setEvaluators(evaluators)
    }
    fetchData()
  }, [get])

  if (loadingEvaluators || evaluators === null) return <Loading withOverlay />

  return (
    <PipelineTypesContext.Provider
      value={{
        directEvaluators,
        pairwiseEvaluators,
        graniteGuardianEvaluators,
        nonGraniteGuardianEvaluators,
        loadingEvaluators,
      }}
    >
      {children}
    </PipelineTypesContext.Provider>
  )
}

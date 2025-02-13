import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'

import { Loading } from '@carbon/react'

import { useFetchUtils } from '@customHooks/useFetchUtils'

import { EvaluationType, Evaluator, FetchedEvaluator } from '../../../types'

interface PipelineContextValue {
  rubricPipelines: Evaluator[] | null
  pairwisePipelines: Evaluator[] | null
  graniteGuardianPipelines: Evaluator[] | null
  loadingPipelines: boolean
}

const PipelineTypesContext = createContext<PipelineContextValue>({
  rubricPipelines: null,
  pairwisePipelines: null,
  graniteGuardianPipelines: null,
  loadingPipelines: false,
})

export const usePipelineTypesContext = () => {
  return useContext(PipelineTypesContext)
}

export const PipelineTypesProvider = ({ children }: { children: ReactNode }) => {
  const [evaluators, setPipelines] = useState<Evaluator[] | null>(null)
  const [loadingPipelines, setLoadingPipelines] = useState(false)
  const { get } = useFetchUtils()

  const rubricPipelines = useMemo(
    () => evaluators?.filter((p) => p.type === EvaluationType.DIRECT) ?? null,
    [evaluators],
  )

  const pairwisePipelines = useMemo(
    () => evaluators?.filter((p) => p.type === EvaluationType.PAIRWISE) ?? null,
    [evaluators],
  )
  const graniteGuardianPipelines = useMemo(
    () => rubricPipelines?.filter((p) => p.name.startsWith('Granite Guardian')) || null,
    [rubricPipelines],
  )

  useEffect(() => {
    const fetchData = async () => {
      setLoadingPipelines(true)
      const response = await get('evaluators/')
      const data = await response.json()
      setLoadingPipelines(false)
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
      setPipelines(evaluators)
    }
    fetchData()
  }, [get])

  if (loadingPipelines || evaluators === null) return <Loading withOverlay />

  return (
    <PipelineTypesContext.Provider
      value={{
        rubricPipelines,
        pairwisePipelines,
        graniteGuardianPipelines,
        loadingPipelines,
      }}
    >
      {children}
    </PipelineTypesContext.Provider>
  )
}

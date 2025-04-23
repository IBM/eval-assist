import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'

import { Loading } from '@carbon/react'

import { useFetchUtils } from '@customHooks/useFetchUtils'
import { returnByPipelineType } from '@utils'

import { EvaluationType, Evaluator, FetchedEvaluator } from '../../../types'

interface EvaluatorOptionsContextValue {
  directEvaluators: Evaluator[] | null
  pairwiseEvaluators: Evaluator[] | null
  graniteGuardianEvaluators: Evaluator[] | null
  nonGraniteGuardianDirectEvaluators: Evaluator[] | null
  nonGraniteGuardianPairwiseEvaluators: Evaluator[] | null
  loadingEvaluators: boolean
}

const EvaluatorOptionsContext = createContext<EvaluatorOptionsContextValue>({
  directEvaluators: null,
  pairwiseEvaluators: null,
  graniteGuardianEvaluators: null,
  nonGraniteGuardianDirectEvaluators: null,
  nonGraniteGuardianPairwiseEvaluators: null,
  loadingEvaluators: false,
})

export const useEvaluatorOptionsContext = () => {
  return useContext(EvaluatorOptionsContext)
}

export const EvaluatorOptionsProvider = ({ children }: { children: ReactNode }) => {
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
    () => directEvaluators?.filter((p) => p.name.startsWith('Granite Guardian')) ?? null,
    [directEvaluators],
  )

  const nonGraniteGuardianDirectEvaluators = useMemo(
    () => evaluators?.filter((p) => p.type === EvaluationType.DIRECT && !p.name.startsWith('Granite Guardian')) ?? null,
    [evaluators],
  )

  const nonGraniteGuardianPairwiseEvaluators = useMemo(
    () =>
      evaluators?.filter((p) => p.type === EvaluationType.PAIRWISE && !p.name.startsWith('Granite Guardian')) ?? null,
    [evaluators],
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
    <EvaluatorOptionsContext.Provider
      value={{
        directEvaluators,
        pairwiseEvaluators,
        graniteGuardianEvaluators,
        nonGraniteGuardianDirectEvaluators,
        nonGraniteGuardianPairwiseEvaluators,
        loadingEvaluators,
      }}
    >
      {children}
    </EvaluatorOptionsContext.Provider>
  )
}

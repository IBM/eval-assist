import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'

import { Loading } from '@carbon/react'

import { useFetchUtils } from '@customHooks/useFetchUtils'
import {
  DirectAssessmentCriteria,
  EvaluationType,
  Evaluator,
  FetchedEvaluator,
  PairwiseComparisonCriteria,
} from '@types'
import { capitalizeFirstWord } from '@utils/utils'

interface PipelineContextValue {
  directCriterias: DirectAssessmentCriteria[] | null
  pairwiseCriterias: PairwiseComparisonCriteria[] | null
  loadingCriterias: boolean
}

const PipelineTypesContext = createContext<PipelineContextValue>({
  directCriterias: null,
  pairwiseCriterias: null,
  loadingCriterias: false,
})

export const useCriteriasContext = () => {
  return useContext(PipelineTypesContext)
}

export const CriteriasProvider = ({ children }: { children: ReactNode }) => {
  const [directCriterias, setDirectCriterias] = useState<DirectAssessmentCriteria[] | null>(null)
  const [pairwiseCriterias, setPairwiseCriterias] = useState<PairwiseComparisonCriteria[] | null>(null)
  const [loadingCriterias, setLoadingCriterias] = useState(false)
  const { get } = useFetchUtils()

  useEffect(() => {
    const fetchData = async () => {
      setLoadingCriterias(true)
      const response = await get('criterias/')
      const data = await response.json()
      setLoadingCriterias(false)
      setDirectCriterias(
        data.direct.map((c: DirectAssessmentCriteria) => ({ ...c, name: capitalizeFirstWord(c.name) })),
      )
      setPairwiseCriterias(
        data.pairwise.map((c: PairwiseComparisonCriteria) => ({ ...c, name: capitalizeFirstWord(c.name) })),
      )
    }
    fetchData()
  }, [get])

  if (loadingCriterias || directCriterias === null || pairwiseCriterias === null) return <Loading withOverlay />

  return (
    <PipelineTypesContext.Provider
      value={{
        directCriterias,
        pairwiseCriterias,
        loadingCriterias,
      }}
    >
      {children}
    </PipelineTypesContext.Provider>
  )
}

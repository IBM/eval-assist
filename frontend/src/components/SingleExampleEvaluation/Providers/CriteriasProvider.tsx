import {
  capitalizeFirstWord,
  getEmptyCriteriaByType,
  getEmptyTestCase,
  returnByPipelineType,
  toSnakeCase,
} from 'src/utils'

import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react'

import { Loading } from '@carbon/react'

import { useFetchUtils } from '@customHooks/useFetchUtils'
import { Criteria, CriteriaWithOptions, EvaluationType, UseCase } from '@types'

interface PipelineContextValue {
  directCriterias: CriteriaWithOptions[] | null
  pairwiseCriterias: Criteria[] | null
  loadingCriterias: boolean
  getCriteria: (name: string, type: EvaluationType) => CriteriaWithOptions | Criteria | null
  getEmptyUseCaseWithCriteria: (criteriaName: string, type: EvaluationType) => UseCase
}

const PipelineTypesContext = createContext<PipelineContextValue>({
  directCriterias: null,
  pairwiseCriterias: null,
  loadingCriterias: false,
  getCriteria: () => null,
  getEmptyUseCaseWithCriteria: () => ({
    ...getEmptyTestCase(EvaluationType.DIRECT),
    criteria: getEmptyCriteriaByType(EvaluationType.DIRECT),
  }),
})

export const useCriteriasContext = () => {
  return useContext(PipelineTypesContext)
}

export const CriteriasProvider = ({ children }: { children: ReactNode }) => {
  const [directCriterias, setDirectCriterias] = useState<CriteriaWithOptions[] | null>(null)
  const [pairwiseCriterias, setPairwiseCriterias] = useState<Criteria[] | null>(null)
  const [loadingCriterias, setLoadingCriterias] = useState(false)
  const { get } = useFetchUtils()
  useEffect(() => {
    const fetchData = async () => {
      setLoadingCriterias(true)
      const response = await get('criterias/')
      const data = await response.json()
      setLoadingCriterias(false)
      setDirectCriterias(data.direct.map((c: CriteriaWithOptions) => ({ ...c, name: toSnakeCase(c.name) })))
      setPairwiseCriterias(data.pairwise.map((c: Criteria) => ({ ...c, name: toSnakeCase(c.name) })))
    }
    fetchData()
  }, [get])

  const getCriteria = useCallback(
    (name: string, type: EvaluationType): CriteriaWithOptions | Criteria | null => {
      if (!directCriterias || !pairwiseCriterias) return null
      const criteria = returnByPipelineType(type, directCriterias, pairwiseCriterias).find((c) => c.name === name) as
        | CriteriaWithOptions
        | Criteria
        | undefined

      if (criteria) {
        const aux = { ...criteria }
        aux.name = capitalizeFirstWord(criteria.name)
        return aux
      }
      return null
    },
    [directCriterias, pairwiseCriterias],
  )

  const getEmptyUseCaseWithCriteria = useCallback(
    (criteriaName: string, type: EvaluationType): UseCase => ({
      ...getEmptyTestCase(type),
      criteria: getCriteria(criteriaName, type) || getEmptyCriteriaByType(type),
    }),
    [getCriteria],
  )

  if (loadingCriterias || directCriterias === null || pairwiseCriterias === null) return <Loading withOverlay />

  return (
    <PipelineTypesContext.Provider
      value={{
        directCriterias,
        pairwiseCriterias,
        loadingCriterias,
        getCriteria,
        getEmptyUseCaseWithCriteria,
      }}
    >
      {children}
    </PipelineTypesContext.Provider>
  )
}

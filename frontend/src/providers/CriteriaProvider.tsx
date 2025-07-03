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
import {
  Criteria,
  CriteriaWithOptions,
  EvaluationType,
  FetchedCriteria,
  FetchedCriteriaWithOptions,
  FetchedCriteriaWithOptionsV0,
  TestCase,
} from '@types'

interface PipelineContextValue {
  directCriterias: CriteriaWithOptions[] | null
  pairwiseCriterias: Criteria[] | null
  loadingCriterias: boolean
  getCriteria: (name: string, type: EvaluationType) => CriteriaWithOptions | Criteria | null
  getEmptyTestCaseWithCriteria: (criteriaName: string, type: EvaluationType) => TestCase
}

const PipelineTypesContext = createContext<PipelineContextValue>({
  directCriterias: null,
  pairwiseCriterias: null,
  loadingCriterias: false,
  getCriteria: () => null,
  getEmptyTestCaseWithCriteria: () => ({
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
      const fetchedCriteria: { direct: FetchedCriteriaWithOptions[]; pairwise: FetchedCriteria[] } =
        await response.json()
      const parsedCriteria = {
        direct: fetchedCriteria.direct.map(
          (fetchedCriterion) =>
            ({
              name: fetchedCriterion.name,
              description: fetchedCriterion.description,
              options: fetchedCriterion.options,
              predictionField: fetchedCriterion.prediction_field,
              contextFields: fetchedCriterion.context_fields,
            } as CriteriaWithOptions),
        ),
        pairwise: fetchedCriteria.pairwise.map(
          (fetchedCriterion) =>
            ({
              name: fetchedCriterion.name,
              description: fetchedCriterion.description,
              predictionField: fetchedCriterion.prediction_field,
              contextFields: fetchedCriterion.context_fields,
            } as Criteria),
        ),
      }
      setLoadingCriterias(false)
      setDirectCriterias(
        [...parsedCriteria.direct, ...notInUnitxtCriteria.direct].map((c) => ({ ...c, name: toSnakeCase(c.name) })),
      )
      setPairwiseCriterias(
        [...parsedCriteria.pairwise, ...notInUnitxtCriteria.pairwise].map((c) => ({ ...c, name: toSnakeCase(c.name) })),
      )
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

  const getEmptyTestCaseWithCriteria = useCallback(
    (criteriaName: string, type: EvaluationType): TestCase => ({
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
        getEmptyTestCaseWithCriteria,
      }}
    >
      {children}
    </PipelineTypesContext.Provider>
  )
}

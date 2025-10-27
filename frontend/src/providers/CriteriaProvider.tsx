import {
  capitalizeFirstWord,
  getEmptyCriteriaByType,
  getEmptyDirectInstance,
  getEmptyPairwiseInstance,
  getEmptyTestCase,
  returnByPipelineType,
} from 'src/utils'

import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react'

import { Loading } from '@carbon/react'

import { notInUnitxtCriteria } from '@constants'
import { useFetchUtils } from '@customHooks/useFetchUtils'
import {
  Criteria,
  CriteriaWithOptions,
  EvaluationType,
  FetchedCriteria,
  FetchedCriteriaWithOptions,
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
      const response = await get('criteria/')
      const fetchedCriteria: { direct: FetchedCriteriaWithOptions[]; pairwise: FetchedCriteria[] } =
        await response.json()
      const parsedCriteria = {
        direct: fetchedCriteria.direct.map(
          (fetchedCriterion) =>
            ({
              name: capitalizeFirstWord(fetchedCriterion.name),
              description: fetchedCriterion.description,
              options: fetchedCriterion.options,
              predictionField: capitalizeFirstWord(fetchedCriterion.to_evaluate_field),
              contextFields: fetchedCriterion.context_fields.map((c) => capitalizeFirstWord(c)),
            } as CriteriaWithOptions),
        ),
        pairwise: fetchedCriteria.pairwise.map(
          (fetchedCriterion) =>
            ({
              name: capitalizeFirstWord(fetchedCriterion.name),
              description: fetchedCriterion.description,
              predictionField: capitalizeFirstWord(fetchedCriterion.to_evaluate_field),
              contextFields: fetchedCriterion.context_fields.map((c) => capitalizeFirstWord(c)),
            } as Criteria),
        ),
      }
      setLoadingCriterias(false)
      setDirectCriterias([...parsedCriteria.direct, ...notInUnitxtCriteria.direct])
      setPairwiseCriterias([...parsedCriteria.pairwise, ...notInUnitxtCriteria.pairwise])
    }
    fetchData()
  }, [get])

  const getCriteria = useCallback(
    (name: string, type: EvaluationType): CriteriaWithOptions | Criteria | null => {
      if (!directCriterias || !pairwiseCriterias) return null
      // console.log(directCriterias)
      const criteria = returnByPipelineType(type, directCriterias, pairwiseCriterias).find(
        (c) => c.name === name || c.name === capitalizeFirstWord(name),
      ) as CriteriaWithOptions | Criteria | undefined

      if (criteria) {
        const aux = { ...criteria }
        aux.name = capitalizeFirstWord(criteria.name)
        if (!aux.contextFields) {
          aux.contextFields = ['Context']
        }
        if (!aux.predictionField) {
          aux.predictionField = 'Response'
        }
        return aux
      }
      return null
    },
    [directCriterias, pairwiseCriterias],
  )

  const getEmptyTestCaseWithCriteria = useCallback(
    (criteriaName: string, type: EvaluationType): TestCase => {
      const criteria = getCriteria(criteriaName, type) || getEmptyCriteriaByType(type)
      const contextFields = criteria.contextFields
      return {
        ...getEmptyTestCase(type),
        criteria,
        instances: returnByPipelineType(
          type,
          [getEmptyDirectInstance(contextFields)],
          [getEmptyPairwiseInstance(contextFields, 2)],
        ),
      }
    },
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

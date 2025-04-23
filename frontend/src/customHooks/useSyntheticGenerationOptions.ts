import { useCallback, useMemo, useState } from 'react'

import {
  Criteria,
  CriteriaWithOptions,
  DomainEnum,
  EvaluationType,
  GenerationLengthEnum,
  PersonaEnum,
  SyntheticGenerationConfig,
  TaskEnum,
} from '@types'

import { useFetchUtils } from './useFetchUtils'

interface Props {
  criteria: Criteria | null
  evaluationType: EvaluationType | null
  syntheticGenerationConfig: SyntheticGenerationConfig | null
}

export const useSyntheticGenerationOptions = ({ criteria, evaluationType, syntheticGenerationConfig }: Props) => {
  const { get } = useFetchUtils()
  const [loadingDomainPersonaMapping, setLoadingDomainPersonaMapping] = useState(false)
  const [domainPersonaMap, setDomainPersonaMap] = useState<{ [key in DomainEnum]: PersonaEnum[] } | null>(null)

  const tasksOptions = useMemo(
    () =>
      Object.values(TaskEnum).map((value) => ({
        text: value,
      })),
    [],
  )

  const domains = useMemo(
    () => (domainPersonaMap ? (Object.keys(domainPersonaMap) as DomainEnum[]) : []),
    [domainPersonaMap],
  )

  const personas = useMemo(
    () =>
      domainPersonaMap && syntheticGenerationConfig && syntheticGenerationConfig.domain
        ? domainPersonaMap[syntheticGenerationConfig.domain] || []
        : [],
    [domainPersonaMap, syntheticGenerationConfig],
  )

  const domainsOptions = useMemo(() => domains.map((d) => ({ text: d })), [domains])

  const personasOptions = useMemo(() => personas.map((p) => ({ text: p })), [personas])

  const generationLengthOptions = useMemo(
    () =>
      Object.values(GenerationLengthEnum).map((value) => ({
        text: value,
      })),
    [],
  )

  const loadDomainPersonaMapping = useCallback(async () => {
    setLoadingDomainPersonaMapping(true)
    const response = await (await get('domains-and-personas/')).json()
    setDomainPersonaMap(response)
    setLoadingDomainPersonaMapping(false)
  }, [get])

  return {
    tasksOptions,
    domainsOptions,
    personasOptions,
    generationLengthOptions,
    loadingDomainPersonaMapping,
    loadDomainPersonaMapping,
  }
}

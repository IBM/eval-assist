import { useCallback, useEffect, useMemo, useState } from 'react'

import { Criteria, CriteriaWithOptions, DomainEnum, GenerationLengthEnum, PersonaEnum } from '@types'

import { useFetchUtils } from './useFetchUtils'

interface Props {
  criteria: Criteria
}

export const useSyntheticGenerationState = ({ criteria }: Props) => {
  const { get } = useFetchUtils()
  const [selectedGenerationLength, setSelectedGenerationLength] = useState<GenerationLengthEnum | null>(null)
  const [selectedDomain, setSelectedDomain] = useState<DomainEnum | null>(null)
  const [selectedPersona, setSelectedPersona] = useState<PersonaEnum | null>(null)

  const [loadingDomainPersonaMapping, setLoadingDomainPersonaMapping] = useState(false)
  const [domainPersonaMap, setDomainPersonaMap] = useState<{ [key in DomainEnum]: PersonaEnum[] } | null>(null)

  const domains = useMemo(
    () => (domainPersonaMap ? (Object.keys(domainPersonaMap) as DomainEnum[]) : []),
    [domainPersonaMap],
  )

  const personas = useMemo(
    () => (domainPersonaMap && selectedDomain ? domainPersonaMap[selectedDomain] || [] : []),
    [domainPersonaMap, selectedDomain],
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

  const [quantityPerCriteriaOption, setQuantityPerCriteriaOption] = useState<{ [k: string]: number }>(
    Object.fromEntries((criteria as CriteriaWithOptions).options.map((option) => [option.name, 1])),
  )

  return {
    selectedGenerationLength,
    setSelectedGenerationLength,
    selectedDomain,
    setSelectedDomain,
    selectedPersona,
    setSelectedPersona,
    domainsOptions,
    personasOptions,
    generationLengthOptions,
    loadingDomainPersonaMapping,
    loadDomainPersonaMapping,
    quantityPerCriteriaOption,
    setQuantityPerCriteriaOption,
  }
}

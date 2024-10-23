import { type } from 'os'

import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'

import { Loading } from '@carbon/react'

import { useFetchUtils } from '@customHooks/useFetchUtils'

import { FetchedPipeline, ModelProviderType, Pipeline, PipelineType } from '../../../types'

interface PipelineContextValue {
  rubricPipelines: Pipeline[] | null
  pairwisePipelines: Pipeline[] | null
  graniteGuardianPipelines: Pipeline[] | null
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
  const [pipelines, setPipelines] = useState<Pipeline[] | null>(null)
  const [loadingPipelines, setLoadingPipelines] = useState(false)
  const { get } = useFetchUtils()

  const rubricPipelines = useMemo(() => pipelines?.filter((p) => p.type === PipelineType.RUBRIC) ?? null, [pipelines])

  const pairwisePipelines = useMemo(
    () => pipelines?.filter((p) => p.type === PipelineType.PAIRWISE) ?? null,
    [pipelines],
  )

  const graniteGuardianPipelines = useMemo(
    () => rubricPipelines?.filter((p) => p.name.startsWith('Granite Guardian')) || null,
    [rubricPipelines],
  )

  useEffect(() => {
    const fetchData = async () => {
      setLoadingPipelines(true)
      const response = await get('pipelines/')
      const data = await response.json()
      setLoadingPipelines(false)
      let pipelines: Pipeline[] = []
      data.pipelines.forEach((p: FetchedPipeline) => {
        p.providers.forEach((provider) => {
          pipelines.push({ ...p, provider })
        })
      })
      setPipelines(pipelines)
    }
    fetchData()
  }, [get])

  if (loadingPipelines || pipelines === null) return <Loading withOverlay />

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

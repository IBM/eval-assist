import { type } from 'os'

import { ReactNode, createContext, useContext, useEffect, useState } from 'react'

import { Loading } from '@carbon/react'

import { get } from '@utils/fetchUtils'

import { Pipeline, PipelineType } from '../types'

interface PipelineContextValue {
  rubricPipelines: string[] | null
  pairwisePipelines: string[] | null
  loadingPipelines: boolean
}

const PipelineTypesContext = createContext<PipelineContextValue>({
  rubricPipelines: null,
  pairwisePipelines: null,
  loadingPipelines: false,
})

export const usePipelineTypesContext = () => {
  return useContext(PipelineTypesContext)
}

export const PipelineTypesProvider = ({ children }: { children: ReactNode }) => {
  const [pipelines, setPipelines] = useState<Pipeline[] | null>(null)
  const [loadingPipelines, setLoadingPipelines] = useState(false)
  useEffect(() => {
    const fetchData = async () => {
      setLoadingPipelines(true)
      const response = await get('pipelines/')
      const data = await response.json()
      setLoadingPipelines(false)
      setPipelines(data.pipelines)
    }
    fetchData()
  }, [])

  if (loadingPipelines || pipelines === null) return <Loading withOverlay />

  return (
    <PipelineTypesContext.Provider
      value={{
        rubricPipelines: pipelines?.filter((p) => p.type === PipelineType.RUBRIC).map((p) => p.name) ?? null,
        pairwisePipelines: pipelines?.filter((p) => p.type === PipelineType.PAIRWISE).map((p) => p.name) ?? null,
        loadingPipelines,
      }}
    >
      {children}
    </PipelineTypesContext.Provider>
  )
}

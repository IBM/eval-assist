import { pipeline } from 'stream'

import { CSSProperties } from 'react'

import Link from 'next/link'

import { Select, SelectItem, SelectSkeleton } from '@carbon/react'

import { returnByPipelineType } from '@utils/utils'

import { Pipeline, PipelineType, UseCase } from '../../types'
import { usePipelineTypesContext } from './Providers/PipelineTypesProvider'
import classes from './SingleExampleEvaluation.module.scss'

interface Props {
  type: PipelineType
  style?: CSSProperties
  className?: string
  selectedPipeline: Pipeline | null
  setSelectedPipeline: (pipeline: Pipeline | null) => Promise<void>
}

export const PipelineSelect = ({ style, className, selectedPipeline, setSelectedPipeline, type }: Props) => {
  const { rubricPipelines, pairwisePipelines, loadingPipelines } = usePipelineTypesContext()

  return (
    <div style={{ marginBottom: '1.5rem' }} className={classes['left-padding']}>
      <span className={classes['toggle-span']}>Evaluator</span>
      {loadingPipelines || rubricPipelines === null || pairwisePipelines === null ? (
        <SelectSkeleton />
      ) : (
        <Select
          id="pipeline-select"
          labelText=""
          helperText={
            <Link rel="noopener noreferrer" target="_blank" href="/documentation/#evaluators">
              How do evaluators work?
            </Link>
          }
          value={selectedPipeline?.name || ''}
          onChange={(e) => {
            const selectedPipelineName = e.target.value
            const selectedPipeline =
              rubricPipelines.find((p) => p.name === selectedPipelineName) ||
              pairwisePipelines.find((p) => p.name === selectedPipelineName) ||
              null
            setSelectedPipeline(selectedPipeline)
          }}
        >
          {(returnByPipelineType(type, rubricPipelines, pairwisePipelines) as Pipeline[]).map((pipeline, i) => (
            <SelectItem value={pipeline.name} text={`${pipeline.name} (${pipeline.provider.toUpperCase()})`} key={i} />
          ))}
        </Select>
      )}
    </div>
  )
}

import { CSSProperties, Dispatch, SetStateAction, useEffect } from 'react'

import Link from 'next/link'

import { Select, SelectItem, SelectSkeleton } from '@carbon/react'

import { usePipelineTypesContext } from './Providers/PipelineTypesProvider'
import classes from './SingleExampleEvaluation.module.scss'
import { PipelineType, UseCase } from './types'

interface Props {
  type: PipelineType
  style?: CSSProperties
  className?: string
  selectedPipeline: string | null
  setSelectedPipeline: (pipeline: string) => Promise<void>
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
          value={selectedPipeline || ''}
          onChange={(e) => {
            setSelectedPipeline(e.target.value)
          }}
        >
          {(PipelineType.RUBRIC ? rubricPipelines : pairwisePipelines).map((pipeline, i) => (
            <SelectItem value={pipeline} text={pipeline} key={i} />
          ))}
        </Select>
      )}
    </div>
  )
}

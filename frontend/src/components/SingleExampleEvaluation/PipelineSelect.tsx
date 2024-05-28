import { CSSProperties, Dispatch, SetStateAction, useEffect } from 'react'

import Link from 'next/link'

import {
  Select,
  SelectItem,
  SelectItemGroup,
  SelectSkeleton,
  Toggletip,
  ToggletipButton,
  ToggletipContent,
} from '@carbon/react'
import { Information } from '@carbon/react/icons'

import { returnByPipelineType } from '@utils/utils'

import { usePipelineTypesContext } from './Providers/PipelineTypesProvider'
import classes from './SingleExampleEvaluation.module.scss'
import { PipelineType } from './types'

interface Props {
  type: PipelineType
  style?: CSSProperties
  className?: string
  selectedPipeline: string | null
  setSelectedPipeline: Dispatch<SetStateAction<string | null>>
}

export const PipelineSelect = ({ style, className, selectedPipeline, setSelectedPipeline, type }: Props) => {
  const { rubricPipelines, pairwisePipelines, loadingPipelines } = usePipelineTypesContext()

  useEffect(() => {
    if (selectedPipeline === null && rubricPipelines !== null && pairwisePipelines !== null && !loadingPipelines) {
      setSelectedPipeline(returnByPipelineType(type, rubricPipelines[0], pairwisePipelines[0]))
    }
  }, [selectedPipeline, rubricPipelines, pairwisePipelines, setSelectedPipeline, loadingPipelines, type])

  return (
    <div style={{ marginBottom: '1.5rem' }} className={classes['left-padding']}>
      <span className={classes['toggle-span']}>Evaluator</span>
      <Toggletip align="top">
        <ToggletipButton label="Show information" className={classes['eval-info-button']}>
          <Information />
        </ToggletipButton>
        <ToggletipContent>
          <p style={{ textAlign: 'center' }}>
            Please refer to{' '}
            <Link href="https://bam.res.ibm.com/docs/models#" target="_blank" rel="noopener noreferrer">
              BAM documentation
            </Link>
            for guidance on related model usage
          </p>
        </ToggletipContent>
      </Toggletip>

      {loadingPipelines || rubricPipelines === null || pairwisePipelines === null ? (
        <SelectSkeleton />
      ) : (
        <Select
          id="pipeline-select"
          labelText=""
          helperText={''}
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

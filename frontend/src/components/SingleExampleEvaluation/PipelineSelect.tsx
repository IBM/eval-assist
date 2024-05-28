import { CSSProperties, Dispatch, SetStateAction, useCallback } from 'react'
import { useEffect, useState } from 'react'

import Link from 'next/link'

import {
  Accordion,
  AccordionItem,
  Select,
  SelectItem,
  SelectSkeleton,
  Toggletip,
  ToggletipButton,
  ToggletipContent,
} from '@carbon/react'
import { Information } from '@carbon/react/icons'

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

export const PipelineSelect = ({ type, style, className, selectedPipeline, setSelectedPipeline }: Props) => {
  const { rubricPipelines, pairwisePipelines, loadingPipelines } = usePipelineTypesContext()

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

      {rubricPipelines === null || pairwisePipelines === null ? (
        <SelectSkeleton />
      ) : (
        <Select
          id="pipeline-select"
          labelText=""
          helperText=""
          value={selectedPipeline || undefined}
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

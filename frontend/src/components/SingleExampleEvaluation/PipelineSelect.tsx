import { CSSProperties, Dispatch, SetStateAction, useCallback } from 'react'
import { useEffect, useState } from 'react'

import { Accordion, AccordionItem, Select, SelectItem, SelectSkeleton } from '@carbon/react'

import { useToastContext } from '@components/ToastProvider/ToastProvider'
import { get } from '@utils/fetchUtils'

import { usePipelineTypesContext } from './PipelineTypesProvider'
import classes from './SingleExampleEvaluation.module.scss'
import { Pipeline, PipelineType } from './types'

interface Props {
  type: PipelineType
  style?: CSSProperties
  className?: string
  selectedPipeline: string | null
  setSelectedPipeline: Dispatch<SetStateAction<string | null>>
}

export const PipelineSelect = ({ type, style, className, selectedPipeline, setSelectedPipeline }: Props) => {
  const { rubricPipelines, pairwisePipelines } = usePipelineTypesContext()

  useEffect(() => {
    if (selectedPipeline === null)
      setSelectedPipeline(type === PipelineType.RUBRIC ? rubricPipelines[0] : pairwisePipelines[0])
  }, [type, rubricPipelines, pairwisePipelines, selectedPipeline, setSelectedPipeline])

  return (
    <div style={style} className={className}>
      <Accordion>
        <AccordionItem title={<h5>Evaluators</h5>} className={classes['accordion-wrapper']} open>
          {(PipelineType.RUBRIC ? rubricPipelines.length === 0 : pairwisePipelines.length === 0) ? (
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
        </AccordionItem>
      </Accordion>
    </div>
  )
}

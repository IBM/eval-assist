import { CSSProperties, Dispatch, SetStateAction } from 'react'
import { useEffect, useState } from 'react'

import { Accordion, AccordionItem, Select, SelectItem } from '@carbon/react'

import { get } from '@utils/fetchUtils'

import classes from './SingleExampleEvaluation.module.scss'

interface PipelineSelectProps {
  type: string
  style?: CSSProperties
  className?: string
  // setSelectedPipeline: Dispatch<SetStateAction<string>>
}

interface Pipeline {
  name: string
  type: string
}

export const PipelineSelect = ({ type, style, className }: PipelineSelectProps) => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const fetchData = async () => {
    try {
      const response = await get('pipelines/')
      const data = await response.json()
      setPipelines(data.pipelines.filter((pipeline: Pipeline) => pipeline.type == type))
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div style={style} className={className}>
      <Accordion>
        <AccordionItem title={<h5>Evaluator</h5>} className={classes['accordion-wrapper']} open>
          <Select id="pipeline-select" labelText="" helperText="">
            {pipelines.map((pipeline, i) => (
              <SelectItem value={pipeline.name} text={pipeline.name} key={i} />
            ))}
          </Select>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

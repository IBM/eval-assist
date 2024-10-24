import { CSSProperties, useMemo } from 'react'

import Link from 'next/link'

import { Select, SelectItem, SelectItemGroup, SelectSkeleton } from '@carbon/react'

import { returnByPipelineType } from '@utils/utils'

import { ModelProviderType, Pipeline, PipelineType, UseCase } from '../../types'
import classes from './PipelineSelect.module.scss'
import { usePipelineTypesContext } from './Providers/PipelineTypesProvider'
import { useURLInfoContext } from './Providers/URLInfoProvider'

interface Props {
  type: PipelineType
  style?: CSSProperties
  className?: string
  selectedPipeline: Pipeline | null
  setSelectedPipeline: (pipeline: Pipeline | null) => Promise<void>
}

export const PipelineSelect = ({ style, className, selectedPipeline, setSelectedPipeline, type }: Props) => {
  const { rubricPipelines, pairwisePipelines, graniteGuardianPipelines, loadingPipelines } = usePipelineTypesContext()
  const { isRisksAndHarms } = useURLInfoContext()
  const filteredPipelines = useMemo(() => {
    let pipelines = returnByPipelineType(type, rubricPipelines, pairwisePipelines) as Pipeline[]
    if (!isRisksAndHarms) {
      pipelines = pipelines.filter((p) => !p.name.startsWith('Granite Guardian'))
    } else {
      pipelines = graniteGuardianPipelines || []
    }
    return pipelines
  }, [graniteGuardianPipelines, isRisksAndHarms, pairwisePipelines, rubricPipelines, type])

  const providerToEvaluators = useMemo(() => {
    const result: { [key: string]: Pipeline[] } = {}

    filteredPipelines.forEach((p) => {
      if (!(p.provider in result)) {
        result[p.provider] = []
      }
      result[p.provider].push(p)
    })

    Object.values(result).forEach((pipelines) =>
      pipelines.sort((a, b) => {
        a.name.split('-').forEach((aSplit, i) => {
          const splitComparison = aSplit.localeCompare(b.name.split('-')[i])
          if (splitComparison !== 0) return splitComparison
        })
        return 1
      }),
    )
    return result
  }, [filteredPipelines])

  const modelProviderBeautifiedName = {
    [ModelProviderType.WATSONX]: 'WatsonX',
    [ModelProviderType.BAM]: 'BAM',
    [ModelProviderType.OPENAI]: 'OpenAI',
  }

  return (
    <div style={{ marginBottom: '1.5rem' }} className={className}>
      <span className={classes['toggle-span']}>Evaluator</span>
      {loadingPipelines || rubricPipelines === null || pairwisePipelines === null ? (
        <SelectSkeleton />
      ) : (
        <Select
          id="pipeline-select"
          labelText=""
          helperText={
            <div className={classes.helperContent}>
              <span className={classes.providerFont}>
                <em>{'Model provider: '}</em>
                <strong></strong>
                {`${modelProviderBeautifiedName[selectedPipeline?.provider as ModelProviderType]}`}
              </span>
              <Link rel="noopener noreferrer" target="_blank" href="/documentation/#evaluators">
                How do evaluators work?
              </Link>
            </div>
          }
          value={JSON.stringify(selectedPipeline) || ''}
          onChange={(e) => {
            const selectedPipeline = JSON.parse(e.target.value)
            setSelectedPipeline(selectedPipeline)
          }}
          className={classes.selectReadOnly}
          // readOnly={isRisksAndHarms}
        >
          {Object.entries(providerToEvaluators).map(([provider, pipelines]) => (
            <SelectItemGroup label={modelProviderBeautifiedName[provider as ModelProviderType]} key={provider}>
              {pipelines.map((pipeline, i) => (
                <SelectItem value={JSON.stringify(pipeline)} text={pipeline.name} key={i} />
              ))}
            </SelectItemGroup>
          ))}
        </Select>
      )}
    </div>
  )
}

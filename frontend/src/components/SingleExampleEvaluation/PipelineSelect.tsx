import { getJSONStringWithSortedKeys, returnByPipelineType } from 'src/utils'

import { CSSProperties, useMemo } from 'react'

import Link from 'next/link'

import { Select, SelectItem, SelectItemGroup, SelectSkeleton } from '@carbon/react'

import { EvaluationType, Evaluator, ModelProviderCredentials, ModelProviderType } from '../../types'
import classes from './PipelineSelect.module.scss'
import { usePipelineTypesContext } from './Providers/PipelineTypesProvider'
import { useURLInfoContext } from './Providers/URLInfoProvider'

interface Props {
  type: EvaluationType
  style?: CSSProperties
  className?: string
  selectedPipeline: Evaluator | null
  setSelectedPipeline: (pipeline: Evaluator | null) => Promise<void>
}

export const PipelineSelect = ({ style, className, selectedPipeline, setSelectedPipeline, type }: Props) => {
  const { rubricPipelines, pairwisePipelines, graniteGuardianPipelines, loadingPipelines } = usePipelineTypesContext()
  const { isRisksAndHarms } = useURLInfoContext()

  const filteredPipelines = useMemo(() => {
    let pipelines = returnByPipelineType(type, rubricPipelines, pairwisePipelines) as Evaluator[]
    if (!isRisksAndHarms) {
      pipelines = pipelines.filter((p) => !p.name.startsWith('Granite Guardian'))
    } else {
      pipelines = graniteGuardianPipelines || []
    }
    return pipelines
  }, [graniteGuardianPipelines, isRisksAndHarms, pairwisePipelines, rubricPipelines, type])

  const providerToEvaluators = useMemo(() => {
    const result: { [key: string]: Evaluator[] } = {}

    filteredPipelines.forEach((p) => {
      if (!(p.provider in result)) {
        result[p.provider] = []
      }
      result[p.provider].push(p)
    })

    Object.values(result).forEach((pipelines) =>
      pipelines.sort((a, b) => {
        let splitComparison = 0
        for (const i in a.name.split('-')) {
          const idx = parseInt(i)
          const aSplit = a.name.split('-')[i]
          const bSplit = b.name.split('-')[i]
          if (idx === 1) {
            const aSplitNumber = parseInt(aSplit.slice(0, -1))
            const bSplitNumber = parseInt(bSplit.slice(0, -1))
            const comparison = aSplitNumber - bSplitNumber
            return comparison
          } else {
            const comparison = aSplit.localeCompare(bSplit)
            if (comparison !== 0) {
              return comparison
            }
          }
        }
        return splitComparison
      }),
    )
    return result
  }, [filteredPipelines])

  const modelProviderBeautifiedName: Record<ModelProviderType, string> = {
    [ModelProviderType.WATSONX]: 'WatsonX',
    [ModelProviderType.OPENAI]: 'OpenAI',
    [ModelProviderType.RITS]: 'RITS',
    [ModelProviderType.AZURE_OPENAI]: 'Azure OpenAI',
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
          value={getJSONStringWithSortedKeys(selectedPipeline) || ''}
          onChange={(e) => {
            const selectedPipeline = JSON.parse(e.target.value)
            setSelectedPipeline(selectedPipeline)
          }}
          className={classes.selectReadOnly}
          // readOnly={isRisksAndHarms}
        >
          {Object.entries(providerToEvaluators).map(([provider, providerEvaluators]) => (
            <SelectItemGroup label={modelProviderBeautifiedName[provider as ModelProviderType]} key={provider}>
              {providerEvaluators.map((evaluator, i) => (
                <SelectItem value={getJSONStringWithSortedKeys(evaluator)} text={evaluator.name} key={i} />
              ))}
            </SelectItemGroup>
          ))}
        </Select>
      )}
    </div>
  )
}

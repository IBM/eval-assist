import cx from 'classnames'
import { modelProviderBeautifiedName } from 'src/constants'
import { getJSONStringWithSortedKeys, returnByPipelineType } from 'src/utils'

import { CSSProperties, useMemo } from 'react'

import Link from 'next/link'

import { Select, SelectItem, SelectItemGroup, SelectSkeleton } from '@carbon/react'
import { Warning } from '@carbon/react/icons'

import { useModelProviderCredentials } from '@customHooks/useModelProviderCredentials'

import { EvaluationType, Evaluator, ModelProviderCredentials, ModelProviderType } from '../../types'
import classes from './PipelineSelect.module.scss'
import { usePipelineTypesContext } from './Providers/PipelineTypesProvider'
import { useURLInfoContext } from './Providers/URLInfoProvider'

interface Props {
  type: EvaluationType
  style?: CSSProperties
  className?: string
  selectedPipeline: Evaluator | null
  setSelectedPipeline: (pipeline: Evaluator | null) => void
  title: string
}

export const PipelineSelect = ({ style, className, selectedPipeline, setSelectedPipeline, type, title }: Props) => {
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

  const providerToEvaluators = useMemo<Record<ModelProviderType, Evaluator[]>>(() => {
    const result: Record<ModelProviderType, Evaluator[]> = {
      [ModelProviderType.RITS]: [],
      [ModelProviderType.WATSONX]: [],
      [ModelProviderType.OPENAI]: [],
      [ModelProviderType.AZURE_OPENAI]: [],
      [ModelProviderType.LOCAL_HF]: [],
    }

    filteredPipelines.forEach((p) => {
      if (!(p.provider in result)) {
        result[p.provider] = []
      }
      result[p.provider]!.push(p)
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

    // Remove provider entries that doesn't have any evaluators
    Object.entries(result).forEach(([provider, evaluators]) => {
      if (evaluators.length === 0) {
        delete result[provider as ModelProviderType]
      }
    })

    return result
  }, [filteredPipelines])

  const { getAreRelevantCredentialsProvided } = useModelProviderCredentials()

  return (
    <div style={{ marginBottom: '1.5rem' }} className={className}>
      <span className={classes['toggle-span']}>{title}</span>
      {loadingPipelines || rubricPipelines === null || pairwisePipelines === null ? (
        <SelectSkeleton />
      ) : (
        <Select
          id="pipeline-select"
          labelText=""
          helperText={
            <div className={classes.helperContent}>
              {selectedPipeline !== null ? (
                <div className={classes.providerFont}>
                  <span>
                    <em>{'Model provider: '}</em>
                    {`${modelProviderBeautifiedName[selectedPipeline?.provider as ModelProviderType]}`}
                  </span>
                  {selectedPipeline !== null && !getAreRelevantCredentialsProvided(selectedPipeline.provider) && (
                    <span className={cx(classes.credentialsNotProvided)}>
                      <Warning />
                      {'Required credentials were not provided'}
                    </span>
                  )}
                </div>
              ) : (
                <div className={classes.providerFont}>
                  {'Provide at least a provider API credentials in order to select an evaluator.'}
                </div>
              )}
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
          {selectedPipeline === null && <SelectItem value={''} text={'No evaluator selected'} />}
          {Object.entries(providerToEvaluators).map(([provider, providerEvaluators]) => (
            <SelectItemGroup
              label={modelProviderBeautifiedName[provider as ModelProviderType]}
              key={provider}
              disabled={!getAreRelevantCredentialsProvided(provider as ModelProviderType)}
            >
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

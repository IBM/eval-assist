import cx from 'classnames'
import { modelProviderBeautifiedName } from 'src/constants'
import { getJSONStringWithSortedKeys } from 'src/utils'

import { CSSProperties, ReactNode, useMemo } from 'react'

import { Link, Select, SelectItem, SelectItemGroup, SelectSkeleton } from '@carbon/react'
import { Warning } from '@carbon/react/icons'

import { useEvaluatorOptionsContext } from '@providers/EvaluatorOptionsProvider'
import { useModelProviderCredentials } from '@providers/ModelProviderCredentialsProvider'

import { Evaluator, ModelProviderType } from '../../types'
import classes from './EvaluatorSelect.module.scss'

interface Props {
  style?: CSSProperties
  className?: string
  dropdownLabel: string
  selectionComponentName?: string
  selectionComponentNameWithArticle?: string
  selectedEvaluator: Evaluator | null
  setSelectedEvaluator: (evaluator: Evaluator | null) => void
  evaluatorOptions: Evaluator[]
  helperChildren?: ReactNode
}

export const PipelineSelect = ({
  style,
  className,
  dropdownLabel,
  selectedEvaluator,
  setSelectedEvaluator,
  evaluatorOptions,
  selectionComponentNameWithArticle = 'an evaluator',
  selectionComponentName = 'evaluator',
  helperChildren,
}: Props) => {
  const { loadingEvaluators, directEvaluators, pairwiseEvaluators } = useEvaluatorOptionsContext()
  const providerToEvaluators = useMemo<Record<ModelProviderType, Evaluator[]>>(() => {
    const result: Record<ModelProviderType, Evaluator[]> = {
      [ModelProviderType.RITS]: [],
      [ModelProviderType.WATSONX]: [],
      [ModelProviderType.OPENAI]: [],
      [ModelProviderType.OPENAI_LIKE]: [],
      [ModelProviderType.AZURE]: [],
      [ModelProviderType.LOCAL_HF]: [],
      [ModelProviderType.TOGETHER_AI]: [],
      [ModelProviderType.AWS]: [],
      [ModelProviderType.VERTEX_AI]: [],
      [ModelProviderType.REPLICATE]: [],
      [ModelProviderType.OLLAMA]: [],
    }
    if (evaluatorOptions === null) return result

    evaluatorOptions.forEach((p) => {
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

    // Remove provider entries that doesn't have any evaluators
    Object.entries(result).forEach(([provider, evaluators]) => {
      if (evaluators.length === 0) {
        delete result[provider as ModelProviderType]
      }
    })

    return result
  }, [evaluatorOptions])

  const { getAreRelevantCredentialsProvided } = useModelProviderCredentials()

  return (
    <div className={className} style={{ ...style }}>
      {loadingEvaluators || directEvaluators === null || pairwiseEvaluators === null ? (
        <SelectSkeleton />
      ) : (
        <Select
          id="pipeline-select"
          labelText={dropdownLabel}
          helperText={
            <div className={classes.helperContent}>
              {selectedEvaluator !== null ? (
                <div className={classes.providerFont}>
                  <span>
                    {'Model provider: '}
                    {`${modelProviderBeautifiedName[selectedEvaluator.provider as ModelProviderType]}`}
                  </span>
                  {selectedEvaluator !== null && !getAreRelevantCredentialsProvided(selectedEvaluator.provider) && (
                    <span className={cx(classes.credentialsNotProvided)}>
                      <Warning />
                      {'Required credentials were not provided'}
                    </span>
                  )}
                </div>
              ) : Object.keys(providerToEvaluators).every(
                  (provider) => !getAreRelevantCredentialsProvided(provider as ModelProviderType),
                ) ? (
                <div className={classes.providerFont}>
                  {`Provide at least a provider API credentials in order to select ${selectionComponentNameWithArticle}.`}
                </div>
              ) : (
                <div className={classes.providerFont}>{`Select ${selectionComponentNameWithArticle}`}</div>
              )}
              {helperChildren}
            </div>
          }
          value={getJSONStringWithSortedKeys(selectedEvaluator) || ''}
          onChange={(e) => {
            const selectedPipeline = JSON.parse(e.target.value)
            setSelectedEvaluator(selectedPipeline)
          }}
          className={classes.selectReadOnly}
          // readOnly={isRisksAndHarms}
        >
          {selectedEvaluator === null && <SelectItem value={''} text={`No ${selectionComponentName} selected`} />}
          {Object.entries(providerToEvaluators).map(([provider, providerEvaluators]) => (
            <SelectItemGroup
              label={modelProviderBeautifiedName[provider as ModelProviderType]}
              key={provider}
              disabled={!getAreRelevantCredentialsProvided(provider as ModelProviderType)}
            >
              {getAreRelevantCredentialsProvided(provider as ModelProviderType) ? (
                providerEvaluators.map((evaluator, i) => (
                  <SelectItem value={getJSONStringWithSortedKeys(evaluator)} text={evaluator.name} key={i} />
                ))
              ) : (
                <SelectItem value="" text="No credentials provided" key={'empty-result'} />
              )}
            </SelectItemGroup>
          ))}
        </Select>
      )}
    </div>
  )
}

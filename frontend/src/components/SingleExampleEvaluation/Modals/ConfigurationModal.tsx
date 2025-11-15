import cx from 'classnames'
import { capitalizeFirstWord, returnByPipelineType } from 'src/utils'

import { Dispatch, SetStateAction, useCallback, useMemo } from 'react'

import { Checkbox, Layer, Link, Modal, NumberInput, Select, SelectItem } from '@carbon/react'

import {
  BASE_JUDGE_DEFAULT_PARAMS_MAP,
  BASE_JUDGE_PARAMS_MAP,
  JUDGE_DEFAULT_PARAMS_MAP,
  JUDGE_PARAMS_MAP,
} from '@constants'
import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useEvaluatorOptionsContext } from '@providers/EvaluatorOptionsProvider'
import { useJudgeOptionsContext } from '@providers/JudgeOptionsProvider'
import { useURLParamsContext } from '@providers/URLParamsProvider'
import { Evaluator } from '@types'

import { ConnectionTest } from '../ConnectionTest'
import { PipelineSelect } from '../EvaluatorSelect'
import classes from './ConfigurationModal.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const ConfigurationModal = ({ open, setOpen }: Props) => {
  const { currentTestCase, setCurrentTestCase } = useCurrentTestCase()
  const { judges } = useJudgeOptionsContext()

  const onJudgeSelect = useCallback(
    (e: { target: { value: string } }) => {
      setCurrentTestCase({
        ...currentTestCase,
        judge: {
          name: e.target.value,
          params: {
            ...BASE_JUDGE_DEFAULT_PARAMS_MAP,
            ...JUDGE_DEFAULT_PARAMS_MAP[currentTestCase.type][e.target.value],
          },
        },
      })
    },
    [currentTestCase, setCurrentTestCase],
  )

  const allParamTypes = useMemo(
    () => ({
      ...BASE_JUDGE_PARAMS_MAP,
      ...JUDGE_PARAMS_MAP[currentTestCase.type][currentTestCase.judge.name],
    }),
    [currentTestCase.judge.name, currentTestCase.type],
  )

  const onChangeParamValue = useCallback(
    (param: string, newValue: any) => {
      setCurrentTestCase({
        ...currentTestCase,
        judge: {
          ...currentTestCase.judge,
          params: {
            ...currentTestCase.judge.params,
            [param]: newValue,
          },
        },
      })
    },
    [currentTestCase, setCurrentTestCase],
  )

  const { nonGraniteGuardianDirectEvaluators, nonGraniteGuardianPairwiseEvaluators, graniteGuardianEvaluators } =
    useEvaluatorOptionsContext()

  const { isRisksAndHarms } = useURLParamsContext()

  const evaluatorOptions = useMemo(
    () =>
      isRisksAndHarms
        ? graniteGuardianEvaluators || []
        : returnByPipelineType(
            currentTestCase.type,
            nonGraniteGuardianDirectEvaluators,
            nonGraniteGuardianPairwiseEvaluators,
          ) || [],
    [
      currentTestCase.type,
      graniteGuardianEvaluators,
      isRisksAndHarms,
      nonGraniteGuardianDirectEvaluators,
      nonGraniteGuardianPairwiseEvaluators,
    ],
  )

  return (
    <Modal
      open={open}
      onRequestClose={() => setOpen(false)}
      modalHeading={`Test case configuration`}
      primaryButtonText="Accept"
      secondaryButtonText="Cancel"
      onRequestSubmit={() => setOpen(false)}
      shouldSubmitOnEnter
      className={cx(classes['bottom-padding'], classes.root)}
    >
      <Layer type={'outline'}>
        <div className={classes.container}>
          <div className={cx(classes.section)}>
            <h5>{'Select judge'}</h5>
            <Select id={'judge_selector'} noLabel onChange={onJudgeSelect} value={currentTestCase.judge.name}>
              {judges[currentTestCase.type].map((judge, i) => (
                <SelectItem key={i} text={`${capitalizeFirstWord(judge)} judge`} value={judge} />
              ))}
            </Select>
          </div>
          <div className={classes.section}>
            <h5>{'Judge configuration'}</h5>
            <div className={classes.configOptions}>
              {Object.entries(currentTestCase.judge.params)
                // sort the params by type alphabetically to make it look more clean
                .sort(([k, v], [k2, v2]) => {
                  return allParamTypes[k].toString().localeCompare(allParamTypes[k2].toString())
                })
                .toReversed()
                .map(([param, value], i) =>
                  allParamTypes[param] === 'boolean' ? (
                    <Checkbox
                      key={i}
                      id={`checkbox-${i}`}
                      labelText={capitalizeFirstWord(param)}
                      onChange={(event, state) => onChangeParamValue(param, state.checked)}
                      checked={currentTestCase.judge.params[param]}
                    />
                  ) : Array.isArray(allParamTypes[param]) ? (
                    <Select
                      key={i}
                      id={`select_${i}`}
                      labelText={capitalizeFirstWord(param)}
                      onChange={(e) => onChangeParamValue(param, e.target.value)}
                      value={currentTestCase.judge.params[param]}
                    >
                      {allParamTypes[param].map((option, i) => (
                        <SelectItem key={i} text={capitalizeFirstWord(option)} value={option} />
                      ))}
                    </Select>
                  ) : allParamTypes[param] === 'number' ? (
                    <NumberInput
                      key={i}
                      id={`number-input-${i}`}
                      max={5}
                      min={1}
                      size="md"
                      step={1}
                      onChange={(event, state) => onChangeParamValue(param, state.value)}
                      value={currentTestCase.judge.params[param]}
                      label={capitalizeFirstWord(param)}
                    />
                  ) : (
                    'unknown type config'
                  ),
                )}
            </div>
          </div>
          <div className={classes.section}>
            <h5>{'Judge model'}</h5>
            <div>
              <PipelineSelect
                dropdownLabel={'Evaluator'}
                style={{ marginBottom: '2rem' }}
                className={classes['left-padding']}
                evaluatorOptions={evaluatorOptions}
                selectedEvaluator={currentTestCase.evaluator}
                setSelectedEvaluator={(evaluator: Evaluator | null) => {
                  setCurrentTestCase({ ...currentTestCase, evaluator })
                }}
                helperChildren={
                  <>
                    <Link
                      rel="noopener noreferrer"
                      target="_blank"
                      href="https://github.com/IBM/eval-assist/wiki#evaluation-methodology"
                    >
                      {'How do evaluators work?'}
                    </Link>
                    <ConnectionTest model={currentTestCase.evaluator} />
                  </>
                }
              />
              <div className={cx(classes.section, classes.topDivider)}>
                <h5>{'Synthetic generation model'}</h5>
                <PipelineSelect
                  selectedEvaluator={currentTestCase.syntheticGenerationConfig.evaluator}
                  setSelectedEvaluator={(newValue) =>
                    setCurrentTestCase({
                      ...currentTestCase,
                      syntheticGenerationConfig: {
                        ...currentTestCase.syntheticGenerationConfig,
                        evaluator: newValue,
                      },
                    })
                  }
                  evaluatorOptions={
                    returnByPipelineType(
                      currentTestCase.type,
                      nonGraniteGuardianDirectEvaluators,
                      nonGraniteGuardianPairwiseEvaluators,
                    ) || []
                  }
                  dropdownLabel={'Synthetic generation'}
                  selectionComponentNameWithArticle="a model"
                  selectionComponentName="model"
                  helperChildren={
                    <>
                      <Link
                        rel="noopener noreferrer"
                        target="_blank"
                        href="https://github.com/IBM/eval-assist/wiki#refining-criteria-with-synthetic-data"
                      >
                        {'What is synthetic generation?'}
                      </Link>
                      <ConnectionTest model={currentTestCase.syntheticGenerationConfig.evaluator!} />
                    </>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </Layer>
    </Modal>
  )
}

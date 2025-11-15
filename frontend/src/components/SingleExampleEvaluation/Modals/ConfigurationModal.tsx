import cx from 'classnames'
import { capitalizeFirstWord } from 'src/utils'

import { Dispatch, SetStateAction, useCallback, useMemo } from 'react'

import { Checkbox, Layer, Modal, NumberInput, Select, SelectItem } from '@carbon/react'

import {
  BASE_JUDGE_DEFAULT_PARAMS_MAP,
  BASE_JUDGE_PARAMS_MAP,
  JUDGE_DEFAULT_PARAMS_MAP,
  JUDGE_PARAMS_MAP,
} from '@constants'
import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useJudgeOptionsContext } from '@providers/JudgeOptionsProvider'

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
          <div className={classes.section}>
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
        </div>
      </Layer>
    </Modal>
  )
}

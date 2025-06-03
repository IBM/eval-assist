import { Dispatch, SetStateAction, useCallback, useEffect, useMemo } from 'react'
import React from 'react'

import {
  ComposedModal,
  Dropdown,
  DropdownSkeleton,
  IconButton,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  TextInput,
  Tooltip,
} from '@carbon/react'
import { Help, Information } from '@carbon/react/icons'

import { DomainEnum, GenerationLengthEnum, PersonaEnum, TaskEnum } from '@constants'
import '@types'
import { SyntheticGenerationConfig } from '@types'

import { useCurrentTestCase } from '../Providers/CurrentTestCaseProvider'
import { useSyntheticGeneration } from '../Providers/SyntheticGenerationProvider'
import classes from './SyntheticGenerationModal.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const SyntheticGenerationModal = ({ open, setOpen }: Props) => {
  const { currentTestCase, setCurrentTestCase } = useCurrentTestCase()
  const { contextVariableNames, responseVariableName, syntheticGenerationConfig } = currentTestCase

  const {
    tasksOptions,
    domainsOptions,
    personasOptions,
    generationLengthOptions,
    loadingDomainPersonaMapping,
    generateTestData,
    loadDomainPersonaMapping,
    setHasGeneratedSyntheticMap,
  } = useSyntheticGeneration()

  const setSyntheticGenerationConfig = useCallback(
    (syntheticGenerationConfig: SyntheticGenerationConfig) => {
      setCurrentTestCase({ ...currentTestCase, syntheticGenerationConfig })
    },
    [currentTestCase, setCurrentTestCase],
  )

  const perTaskIndication = useMemo(() => {
    return {
      [TaskEnum.QuestionAnswering]: 'This task accepts only one context variable that will be set to a question',
      [TaskEnum.Summarization]: 'This task only accepts one context variable that will be set to the text to summarize',
      [TaskEnum.TextGeneration]: 'Context-free text generation',
    }
  }, [])

  const defaultTaskIndication = useMemo(
    () =>
      `Generic synthetic generation task. EvalAssit will generate the context variables (${contextVariableNames
        .map((x) => "'" + x + "'")
        .join(', ')}) and the '${responseVariableName}'`,
    [contextVariableNames, responseVariableName],
  )

  const onRequestSubmit = useCallback(() => {
    setOpen(false)
    generateTestData()
    setHasGeneratedSyntheticMap((prev) =>
      Object.fromEntries(Object.keys(prev).map((k) => [k, k === currentTestCase.name ? true : prev[k]])),
    )
  }, [currentTestCase.name, generateTestData, setHasGeneratedSyntheticMap, setOpen])

  useEffect(() => {
    loadDomainPersonaMapping()
  }, [loadDomainPersonaMapping])

  if (syntheticGenerationConfig.perCriteriaOptionCount === null || !syntheticGenerationConfig.borderlineCount === null)
    return

  return (
    <ComposedModal open={open} onClose={() => setOpen(false)}>
      <ModalHeader
        title={
          <div className={classes.helperContent}>
            {'Generate synthetic examples'}
            <IconButton
              kind={'ghost'}
              label="Help"
              target="_blank"
              rel={'noopener noreferrer'}
              href={'https://github.com/IBM/eval-assist/wiki#refining-criteria-with-synthetic-data'}
            >
              <Help />
            </IconButton>
          </div>
        }
      />
      <ModalBody>
        <div className={classes.user_setup_container}>
          <div className={classes.section}>
            <div className={classes.section_description_container}>
              <p className={classes.section_title}>Instruction</p>
              <p className={classes.section_description}>Specify what kind of data you would like to generate</p>
            </div>
            <div className={classes.instruction_container}>
              <Select
                id={'task-selection'}
                labelText={'Task'}
                onChange={(e) =>
                  setSyntheticGenerationConfig({
                    ...syntheticGenerationConfig,
                    task: e.target.value !== '' ? (e.target.value as TaskEnum) : null,
                  })
                }
                value={syntheticGenerationConfig.task || ''}
              >
                <SelectItem key={'Generic/Unstrutured'} value={''} text={'Generic/Unstrutured'} />
                {tasksOptions.map((task, i) => (
                  <SelectItem key={i} value={task} text={task} />
                ))}
              </Select>
              <p className={classes.task_indication}>
                {syntheticGenerationConfig.task
                  ? perTaskIndication[syntheticGenerationConfig.task]
                  : defaultTaskIndication}
              </p>

              {!loadingDomainPersonaMapping ? (
                <Dropdown
                  items={syntheticGenerationConfig.domain ? ['No specific domain', ...domainsOptions] : domainsOptions}
                  label=""
                  id="domain"
                  titleText="Domain"
                  type="default"
                  selectedItem={syntheticGenerationConfig.domain || 'No specific domain'}
                  onChange={({ selectedItem }) => {
                    const newSelectedDomain = selectedItem as DomainEnum
                    if (newSelectedDomain !== syntheticGenerationConfig.domain) {
                      setSyntheticGenerationConfig({ ...syntheticGenerationConfig, persona: null })
                    }
                    setSyntheticGenerationConfig({
                      ...syntheticGenerationConfig,
                      domain: selectedItem === 'No specific domain' ? null : (selectedItem as DomainEnum),
                      persona: null,
                    })
                  }}
                />
              ) : (
                <DropdownSkeleton />
              )}
              {!loadingDomainPersonaMapping ? (
                <Dropdown
                  disabled={!syntheticGenerationConfig.domain}
                  items={
                    syntheticGenerationConfig.persona ? ['No specific persona', ...personasOptions] : personasOptions
                  }
                  label=""
                  id="persona"
                  titleText="Persona"
                  type="default"
                  selectedItem={syntheticGenerationConfig.persona || 'No specific persona'}
                  onChange={({ selectedItem }) =>
                    setSyntheticGenerationConfig({
                      ...syntheticGenerationConfig,
                      persona: selectedItem === 'No specific persona' ? null : (selectedItem as PersonaEnum),
                    })
                  }
                />
              ) : (
                <DropdownSkeleton />
              )}
              {!loadingDomainPersonaMapping && syntheticGenerationConfig.domain === null && (
                <p className={classes.task_indication}>{'Select a domain to unlock the persona options'}</p>
              )}
              <Dropdown
                items={
                  syntheticGenerationConfig.generationLength
                    ? ['Not specific length', ...generationLengthOptions]
                    : generationLengthOptions
                }
                label=""
                id="data-length"
                titleText="Data length"
                type="default"
                selectedItem={syntheticGenerationConfig.generationLength || 'Not specific length'}
                onChange={({ selectedItem }) =>
                  setSyntheticGenerationConfig({
                    ...syntheticGenerationConfig,
                    generationLength:
                      selectedItem === 'Not specific length' ? null : (selectedItem as GenerationLengthEnum),
                  })
                }
              />
            </div>
          </div>
          <div className={classes.vertical_divider} />
          <div className={classes.section}>
            <div className={classes.section_description_container}>
              <p className={classes.section_title}>Quantity</p>
              <p className={classes.section_description}>
                Specify how much data per each expected result you would like to generator
              </p>
            </div>
            <div className={classes.quantity_container}>
              {Object.entries(syntheticGenerationConfig.perCriteriaOptionCount).map(
                ([optionName, optionQuantity], i) => (
                  <React.Fragment key={i}>
                    <TextInput
                      id={`${i}_optionname_${optionName}`}
                      key={`${i}_optionname_${optionName}`}
                      value={optionName}
                      readOnly
                      onChange={() => {}}
                      size="md"
                      type="text"
                      labelText={'Expected result'}
                    />
                    <TextInput
                      id={`${i}_quantity_${optionName}`}
                      key={`${i}_quantity_${optionName}`}
                      onChange={(e) => {
                        setSyntheticGenerationConfig({
                          ...syntheticGenerationConfig,
                          perCriteriaOptionCount: {
                            ...syntheticGenerationConfig.perCriteriaOptionCount,
                            [optionName]: Number(e.target.value),
                          },
                        })
                      }}
                      size="md"
                      type="number"
                      labelText={'Quantity'}
                      value={optionQuantity}
                    />
                  </React.Fragment>
                ),
              )}
              <TextInput
                id={`optionname_borderline`}
                key={`optionname_borderline`}
                value={'Borderline'}
                readOnly
                onChange={() => {}}
                size="md"
                type="text"
                labelText={
                  <>
                    <label className={'cds--label'}>{'Expected result'}</label>
                    <Tooltip
                      label={
                        <p style={{ textAlign: 'center' }}>
                          {
                            'Borderline examples: Generate examples that do not clearly fit any of the available options. Use these edge cases to refine and improve your criteria definitions.'
                          }
                        </p>
                      }
                      align="top"
                    >
                      <Information className={classes.headerInfoIcon} />
                    </Tooltip>
                  </>
                }
              />
              <TextInput
                id={`borderline_quantity`}
                key={`borderline_quantity`}
                onChange={(e) => {
                  setSyntheticGenerationConfig({
                    ...syntheticGenerationConfig,
                    borderlineCount: Number(e.target.value),
                  })
                }}
                size="md"
                type="number"
                labelText={'Quantity'}
                value={syntheticGenerationConfig.borderlineCount!}
              />
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter
        primaryButtonText="Generate"
        secondaryButtonText="Cancel"
        onRequestSubmit={onRequestSubmit}
        primaryButtonDisabled={syntheticGenerationConfig.evaluator === null}
      >
        <></>
      </ModalFooter>
    </ComposedModal>
  )
}

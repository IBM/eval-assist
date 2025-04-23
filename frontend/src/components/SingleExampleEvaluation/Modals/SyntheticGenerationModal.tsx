import { Dispatch, SetStateAction, useCallback, useEffect, useMemo } from 'react'
import React from 'react'

import {
  ComposedModal,
  Dropdown,
  DropdownSkeleton,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
  Tooltip,
} from '@carbon/react'
import { Information } from '@carbon/react/icons'

import {
  Criteria,
  CriteriaWithOptions,
  DomainEnum,
  GenerationLengthEnum,
  PersonaEnum,
  SyntheticGenerationConfig,
  TaskEnum,
} from '@types'
import { EvaluationType, Evaluator } from '@types'
import { returnByPipelineType } from '@utils'

import { PipelineSelect } from '../EvaluatorSelect'
import { usePipelineTypesContext } from '../Providers/PipelineTypesProvider'
import classes from './SyntheticGenerationModal.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  evaluationType: EvaluationType
  generateTestData: () => Promise<void>
  syntheticGenerationConfig: SyntheticGenerationConfig
  setSyntheticGenerationConfig: React.Dispatch<React.SetStateAction<SyntheticGenerationConfig>>
  tasksOptions: {
    text: TaskEnum
  }[]
  domainsOptions: {
    text: DomainEnum
  }[]
  personasOptions: {
    text: PersonaEnum
  }[]
  generationLengthOptions: {
    text: GenerationLengthEnum
  }[]
  loadingDomainPersonaMapping: boolean
  loadDomainPersonaMapping: () => Promise<void>
  criteria: Criteria
  contextVariableNames: string[]
  responseVariableName: string
}

export const SyntheticGenerationModal = ({
  open,
  setOpen,
  evaluationType,
  generateTestData,
  tasksOptions,
  domainsOptions,
  personasOptions,
  generationLengthOptions,
  loadingDomainPersonaMapping,
  loadDomainPersonaMapping,
  criteria,
  syntheticGenerationConfig,
  setSyntheticGenerationConfig,
  contextVariableNames,
  responseVariableName,
}: Props) => {
  const criteriaOptionNames = useMemo(
    () =>
      criteria && evaluationType
        ? returnByPipelineType(
            evaluationType,
            () => (criteria as CriteriaWithOptions).options.map((option) => option.name),
            [],
          )
        : [],
    [criteria, evaluationType],
  )

  useEffect(() => {
    if (syntheticGenerationConfig.perCriteriaOptionCount === null) {
      setSyntheticGenerationConfig({
        ...syntheticGenerationConfig,
        perCriteriaOptionCount: Object.fromEntries(criteriaOptionNames.map((optionName) => [optionName, 1])),
      })
    }

    if (syntheticGenerationConfig.borderlineCount === null) {
      setSyntheticGenerationConfig({
        ...syntheticGenerationConfig,
        borderlineCount: 1,
      })
    }
    if (syntheticGenerationConfig.perCriteriaOptionCount !== null) {
      if (
        !criteriaOptionNames.every(
          (criteriaOptionName) => criteriaOptionName in syntheticGenerationConfig.perCriteriaOptionCount!,
        )
      ) {
        setSyntheticGenerationConfig((prev: SyntheticGenerationConfig) => {
          const result: Record<string, number> = {}
          // add new
          criteriaOptionNames.forEach((k) => {
            if (!Object.keys(prev).includes(k)) {
              result[k] = 1
            } else {
              result[k] = prev.perCriteriaOptionCount![k]
            }
          })
          return { ...syntheticGenerationConfig, perCriteriaOptionCount: result } as SyntheticGenerationConfig
        })
      }
    }
  }, [criteriaOptionNames, setSyntheticGenerationConfig, syntheticGenerationConfig])

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
  }, [generateTestData, setOpen])

  const { nonGraniteGuardianEvaluators } = usePipelineTypesContext()

  useEffect(() => {
    loadDomainPersonaMapping()
  }, [loadDomainPersonaMapping])

  if (syntheticGenerationConfig.perCriteriaOptionCount === null || !syntheticGenerationConfig.borderlineCount === null)
    return

  return (
    <ComposedModal open={open} onClose={() => setOpen(false)}>
      <ModalHeader title="Generate synthetic examples" />
      <ModalBody>
        <div className={classes.user_setup_container}>
          <div className={classes.section}>
            <div className={classes.section_description_container}>
              <p className={classes.section_title}>Model</p>
              <p className={classes.section_description}>Specify what model you would like to use to generate data</p>
            </div>
            <div>
              <PipelineSelect
                type={evaluationType}
                selectedEvaluator={syntheticGenerationConfig.evaluator}
                setSelectedEvaluator={(newValue) =>
                  setSyntheticGenerationConfig({
                    ...syntheticGenerationConfig,
                    evaluator: newValue,
                  })
                }
                evaluatorOptions={nonGraniteGuardianEvaluators || []}
                dropdownLabel={'Model for synthetic generation (required)'}
                selectionComponentNameWithArticle="a model"
                selectionComponentName="model"
              />
            </div>
          </div>
          <div className={classes.vertical_divider} />
          <div className={classes.section}>
            <div className={classes.section_description_container}>
              <p className={classes.section_title}>Instruction</p>
              <p className={classes.section_description}>Specify what kind of data you would like to generate</p>
            </div>
            <div className={classes.instruction_container}>
              <Dropdown
                itemToString={(i: { text: string }) => i.text}
                items={tasksOptions}
                label="No option selected"
                id="task"
                titleText="Task"
                type="default"
                selectedItem={syntheticGenerationConfig.task ? { text: syntheticGenerationConfig.task } : null}
                onChange={({ selectedItem }) =>
                  setSyntheticGenerationConfig({ ...syntheticGenerationConfig, task: selectedItem?.text as TaskEnum })
                }
              />
              <p className={classes.task_indication}>
                {syntheticGenerationConfig.task
                  ? perTaskIndication[syntheticGenerationConfig.task]
                  : defaultTaskIndication}
              </p>

              {!loadingDomainPersonaMapping ? (
                <Dropdown
                  itemToString={(i: { text: string }) => i.text}
                  items={domainsOptions}
                  label="No specific domain"
                  id="domain"
                  titleText="Domain"
                  type="default"
                  selectedItem={syntheticGenerationConfig.domain ? { text: syntheticGenerationConfig.domain } : null}
                  onChange={({ selectedItem }) => {
                    const newSelectedDomain = selectedItem?.text as DomainEnum
                    if (newSelectedDomain !== syntheticGenerationConfig.domain) {
                      setSyntheticGenerationConfig({ ...syntheticGenerationConfig, persona: null })
                    }
                    setSyntheticGenerationConfig({
                      ...syntheticGenerationConfig,
                      domain: selectedItem?.text as DomainEnum,
                    })
                  }}
                />
              ) : (
                <DropdownSkeleton />
              )}
              {!loadingDomainPersonaMapping ? (
                <Dropdown
                  disabled={!syntheticGenerationConfig.domain}
                  itemToString={(i: { text: string }) => i.text}
                  items={personasOptions}
                  label="No specific persona"
                  id="persona"
                  titleText="Persona"
                  type="default"
                  selectedItem={syntheticGenerationConfig.persona ? { text: syntheticGenerationConfig.persona } : null}
                  onChange={({ selectedItem }) =>
                    setSyntheticGenerationConfig({
                      ...syntheticGenerationConfig,
                      persona: selectedItem?.text as PersonaEnum,
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
                itemToString={(i: { text: string }) => i.text}
                items={generationLengthOptions}
                label="No option selected"
                id="data-length"
                titleText="Data length"
                type="default"
                selectedItem={
                  syntheticGenerationConfig.generationLength
                    ? { text: syntheticGenerationConfig.generationLength }
                    : null
                }
                onChange={({ selectedItem }) =>
                  setSyntheticGenerationConfig({
                    ...syntheticGenerationConfig,
                    generationLength: selectedItem?.text as GenerationLengthEnum,
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

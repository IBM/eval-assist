import { Dispatch, SetStateAction, useCallback, useEffect } from 'react'
import React from 'react'

import {
  ComposedModal,
  Dropdown,
  DropdownSkeleton,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from '@carbon/react'

import { Criteria, CriteriaWithOptions, DomainEnum, GenerationLengthEnum, PersonaEnum, TaskEnum } from '@types'
import { EvaluationType, Evaluator } from '@types'

import { PipelineSelect } from '../EvaluatorSelect'
import { usePipelineTypesContext } from '../Providers/PipelineTypesProvider'
import classes from './SyntheticGenerationModal.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  type: EvaluationType
  modelForSyntheticGeneration: Evaluator | null
  setModelForSyntheticGeneration: Dispatch<SetStateAction<Evaluator | null>>
  generateTestData: () => Promise<void>
  selectedGenerationLength: GenerationLengthEnum | null
  setSelectedGenerationLength: Dispatch<SetStateAction<GenerationLengthEnum | null>>
  selectedTask: TaskEnum | null
  setSelectedTask: Dispatch<SetStateAction<TaskEnum | null>>
  selectedDomain: DomainEnum | null
  setSelectedDomain: Dispatch<SetStateAction<DomainEnum | null>>
  selectedPersona: PersonaEnum | null
  setSelectedPersona: Dispatch<SetStateAction<PersonaEnum | null>>
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
  quantityPerCriteriaOption: {
    [k: string]: number
  }
  setQuantityPerCriteriaOption: Dispatch<
    SetStateAction<{
      [k: string]: number
    }>
  >
}

export const SyntheticGenerationModal = ({
  open,
  setOpen,
  type,
  modelForSyntheticGeneration,
  setModelForSyntheticGeneration,
  generateTestData,
  selectedGenerationLength,
  setSelectedGenerationLength,
  selectedTask,
  setSelectedTask,
  selectedDomain,
  setSelectedDomain,
  selectedPersona,
  setSelectedPersona,
  tasksOptions,
  domainsOptions,
  personasOptions,
  generationLengthOptions,
  loadingDomainPersonaMapping,
  loadDomainPersonaMapping,
  criteria,
  quantityPerCriteriaOption,
  setQuantityPerCriteriaOption,
}: Props) => {
  const onRequestSubmit = useCallback(() => {
    setOpen(false)
    generateTestData()
  }, [generateTestData, setOpen])

  const { nonGraniteGuardianEvaluators } = usePipelineTypesContext()

  useEffect(() => {
    loadDomainPersonaMapping()
  }, [loadDomainPersonaMapping])

  return (
    <ComposedModal open={open} onClose={() => setOpen(false)}>
      <ModalHeader title="Generate synthetic example" />
      <ModalBody>
        <div className={classes.user_setup_container}>
          <div className={classes.section}>
            <div className={classes.section_description_container}>
              <p className={classes.section_title}>Model</p>
              <p className={classes.section_description}>Specify what model you would like to use to generate data</p>
            </div>
            <div>
              <PipelineSelect
                type={type}
                selectedEvaluator={modelForSyntheticGeneration}
                setSelectedEvaluator={setModelForSyntheticGeneration}
                evaluatorOptions={nonGraniteGuardianEvaluators || []}
                dropdownLabel={'Model for synthetic generation'}
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
                items={generationLengthOptions}
                label="No option selected"
                id="data-length"
                titleText="Data length"
                type="default"
                selectedItem={selectedGenerationLength ? { text: selectedGenerationLength } : null}
                onChange={({ selectedItem }) => setSelectedGenerationLength(selectedItem?.text as GenerationLengthEnum)}
              />
              <Dropdown
                itemToString={(i: { text: string }) => i.text}
                items={tasksOptions}
                label="No option selected"
                id="task"
                titleText="Task"
                type="default"
                selectedItem={selectedTask ? { text: selectedTask } : null}
                onChange={({ selectedItem }) => setSelectedTask(selectedItem?.text as TaskEnum)}
              />
              {!loadingDomainPersonaMapping ? (
                <Dropdown
                  itemToString={(i: { text: string }) => i.text}
                  items={domainsOptions}
                  label="All domains"
                  id="domain"
                  titleText="Domain"
                  type="default"
                  selectedItem={selectedDomain ? { text: selectedDomain } : null}
                  onChange={({ selectedItem }) => {
                    const newSelectedDomain = selectedItem?.text as DomainEnum
                    if (newSelectedDomain !== selectedDomain) {
                      setSelectedPersona(null)
                    }
                    setSelectedDomain(selectedItem?.text as DomainEnum)
                  }}
                />
              ) : (
                <DropdownSkeleton />
              )}
              {!loadingDomainPersonaMapping ? (
                <Dropdown
                  disabled={!selectedDomain}
                  itemToString={(i: { text: string }) => i.text}
                  items={personasOptions}
                  label="All personas"
                  id="persona"
                  titleText="Select persona"
                  type="default"
                  selectedItem={selectedPersona ? { text: selectedPersona } : null}
                  onChange={({ selectedItem }) => setSelectedPersona(selectedItem?.text as PersonaEnum)}
                />
              ) : (
                <DropdownSkeleton />
              )}
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
              {Object.entries(quantityPerCriteriaOption).map(([optionName, optionQuantity], i) => (
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
                      setQuantityPerCriteriaOption({
                        ...quantityPerCriteriaOption,
                        [optionName]: Number(e.target.value),
                      })
                    }}
                    size="md"
                    type="number"
                    labelText={'Quantity'}
                    value={optionQuantity}
                  />
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter
        primaryButtonText="Generate"
        secondaryButtonText="Cancel"
        onRequestSubmit={onRequestSubmit}
        primaryButtonDisabled={modelForSyntheticGeneration === null}
      >
        <></>
      </ModalFooter>
    </ComposedModal>
  )
}

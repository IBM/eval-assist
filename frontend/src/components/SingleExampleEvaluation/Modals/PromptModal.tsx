import cx from 'classnames'

import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { Layer, Link, Loading, Modal, Select, SelectItem, SelectItemGroup } from '@carbon/react'

import { useFetchUtils } from '@customHooks/useFetchUtils'
import { ModelProviderCredentials, ModelProviderType, PipelineType, UseCaseV1 } from '@types'
import { getCriteria, toSnakeCase } from '@utils/utils'

import classes from './PromptModal.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  currentUseCase: UseCaseV1 | null
  modelProviderCredentials: ModelProviderCredentials
}

export const PromptModal = ({ open, setOpen, currentUseCase, modelProviderCredentials }: Props) => {
  const [prompts, setPrompts] = useState<string[] | null>(null)
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number>(0)

  const { post } = useFetchUtils()

  useEffect(() => {
    const getPrompts = async () => {
      if (currentUseCase !== null && open) {
        const parsedCriteria = { ...currentUseCase.criteria }
        // check if criteria description changed and criteria name didn't
        const harmsAndRiskCriteria = getCriteria(
          `${toSnakeCase(currentUseCase.criteria.name)}>${toSnakeCase(currentUseCase.responseVariableName)}`,
          PipelineType.RUBRIC,
        )
        if (harmsAndRiskCriteria !== null && harmsAndRiskCriteria.criteria !== currentUseCase.criteria.criteria) {
          // the tokenizer of granite guardian will complain if we send a predefined criteria name
          // with a custom description.
          parsedCriteria.name = `${parsedCriteria.name}_variation`
        }

        const parsedContextVariables = currentUseCase.contextVariables.reduce(
          (acc, item, index) => ({ ...acc, [item.variable]: item.value }),
          {},
        )

        let body: any = {
          context_variables: parsedContextVariables,
          responses: currentUseCase.responses,
          pipeline: currentUseCase.pipeline?.name,
          provider: currentUseCase.pipeline?.provider,
          criteria: parsedCriteria,
          type: currentUseCase.type,
          response_variable_name: currentUseCase.responseVariableName,
          llm_provider_credentials:
            modelProviderCredentials[currentUseCase.pipeline?.provider || ModelProviderType.BAM],
        }

        const prompts = await (await post('prompt/', body)).json()
        setPrompts(prompts)
      }
    }
    getPrompts()
  }, [currentUseCase, modelProviderCredentials, open, post])

  useEffect(() => {
    if (open) {
      setPrompts(null)
    }
  }, [open])

  const onClose = () => {
    setOpen(false)
  }

  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      passiveModal
      size="sm"
      modalHeading={currentUseCase !== null && currentUseCase.responses.length > 1 ? 'Prompts' : 'Prompt'}
    >
      <Layer style={{ display: 'flex', flexDirection: 'column' }}>
        {prompts === null ? (
          <div className={classes.loadingRoot}>
            <span>{'Loading'}</span>
            <Loading withOverlay={false} small />
          </div>
        ) : (
          <div className={classes.content}>
            {prompts !== null && prompts?.length > 1 && (
              <Select
                id="prompt-select"
                labelText="Prompts"
                value={selectedPromptIndex.toString()}
                onChange={(e) => {
                  setSelectedPromptIndex(parseInt(e.target.value))
                }}
                size="sm"
                className={classes.selectReadOnly}
                // readOnly={isRisksAndHarms}
              >
                {prompts.map((p, i) => (
                  <SelectItem value={i} text={`Prompt ${i + 1}`} key={i} />
                ))}
              </Select>
            )}
            <div className={classes.prompt}>{prompts[selectedPromptIndex]}</div>
          </div>
        )}
      </Layer>
    </Modal>
  )
}

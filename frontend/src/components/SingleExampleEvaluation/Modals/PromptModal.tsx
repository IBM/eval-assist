import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { Loading, Modal, Select, SelectItem } from '@carbon/react'

import { useCriterias } from '@customHooks/useCriterias'
import { useFetchUtils } from '@customHooks/useFetchUtils'
import { DirectInstance, EvaluationType, ModelProviderCredentials, ModelProviderType, UseCase } from '@types'
import { toSnakeCase } from '@utils/utils'

import classes from './PromptModal.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  currentUseCase: UseCase | null
  modelProviderCredentials: ModelProviderCredentials
}

export const PromptModal = ({ open, setOpen, currentUseCase, modelProviderCredentials }: Props) => {
  const [prompts, setPrompts] = useState<string[] | null>(null)
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number>(0)
  const { getCriteria } = useCriterias()

  const { post } = useFetchUtils()

  useEffect(() => {
    const getPrompts = async () => {
      if (currentUseCase !== null && open) {
        const parsedCriteria = { ...currentUseCase.criteria }
        // check if criteria description changed and criteria name didn't
        const harmsAndRiskCriteria = getCriteria(
          `${toSnakeCase(currentUseCase.criteria.name)}>${toSnakeCase(currentUseCase.responseVariableName)}`,
          EvaluationType.DIRECT,
        )
        if (harmsAndRiskCriteria !== null && harmsAndRiskCriteria.description !== currentUseCase.criteria.description) {
          // the tokenizer of granite guardian will complain if we send a predefined criteria name
          // with a custom description.
          parsedCriteria.name = `${parsedCriteria.name}_variation`
        }

        const parsedContextVariables = currentUseCase.instances[0].contextVariables.reduce(
          (acc, item, index) => ({ ...acc, [item.name]: item.value }),
          {},
        )

        let body: any = {
          context_variables: parsedContextVariables,
          responses: (currentUseCase.instances as DirectInstance[]).map((instance) => instance.response),
          pipeline: currentUseCase.evaluator?.name,
          provider: currentUseCase.evaluator?.provider,
          criteria: parsedCriteria,
          type: currentUseCase.type,
          response_variable_name: currentUseCase.responseVariableName,
          llm_provider_credentials: modelProviderCredentials[ModelProviderType.WATSONX],
        }

        const prompts = await (await post('prompt/', body)).json()
        setPrompts(prompts)
      }
    }
    getPrompts()
  }, [currentUseCase, getCriteria, modelProviderCredentials, open, post])

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
      modalHeading={
        currentUseCase !== null &&
        (currentUseCase.instances as DirectInstance[]).map((instance) => instance.response).length > 1
          ? 'Prompts'
          : 'Prompt'
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
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
      </div>
    </Modal>
  )
}

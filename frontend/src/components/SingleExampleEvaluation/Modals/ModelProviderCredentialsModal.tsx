import cx from 'classnames'

import React, { Dispatch, SetStateAction } from 'react'

import { ComposedModal, FormGroup, Link, ModalBody, ModalFooter, ModalHeader, TextInput } from '@carbon/react'

import { useModelProviderCredentials } from '../Providers/ModelProviderCredentialsProvider'
import classes from './ModelProviderCredentialsModal.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const ModelProviderCredentialsModal = ({ open, setOpen }: Props) => {
  const { modelProviderCredentials, setModelProviderCredentials, defaultCrendentials } = useModelProviderCredentials()
  return (
    <ComposedModal open={open} onClose={() => setOpen(false)}>
      <ModalHeader title="Model provider credentials" />
      <ModalBody>
        <div>
          <p className={'cds--label'} style={{ marginBottom: '1rem' }}>
            Your credentials are only stored in your browser and are used solely to communicate directly to the model
            provider APIs
          </p>
          <div className={classes.bottomDivider} />
          <FormGroup legendText={''}>
            <div className={cx(classes.modelProviderContainer)}>
              <p className={cx(classes.modelProviderName)}>Watsonx</p>
              <div className={classes.credentialsContainer}>
                <TextInput
                  id={'watsonx-api-key-input'}
                  labelText="API key"
                  value={modelProviderCredentials.watsonx.api_key}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setModelProviderCredentials({
                      ...modelProviderCredentials,
                      watsonx: { ...modelProviderCredentials.watsonx, api_key: e.target.value },
                    })
                  }
                  className={classes.credentialInput}
                  autoComplete="off"
                />
                <TextInput
                  id={'watsonx-project-id-input'}
                  labelText="Project ID"
                  value={modelProviderCredentials.watsonx.project_id}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setModelProviderCredentials({
                      ...modelProviderCredentials,
                      watsonx: { ...modelProviderCredentials.watsonx, project_id: e.target.value },
                    })
                  }
                  autoComplete="off"
                  className={classes.credentialInput}
                />
                <TextInput
                  id={'watsonx-api-base-input'}
                  labelText="Base URL"
                  value={modelProviderCredentials.watsonx.api_base}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setModelProviderCredentials({
                      ...modelProviderCredentials,
                      watsonx: { ...modelProviderCredentials.watsonx, api_base: e.target.value },
                    })
                  }
                  autoComplete="off"
                  placeholder={defaultCrendentials.watsonx?.api_base}
                />
                <p className="cds--form__helper-text">
                  {"Don't have a key? Get one "}
                  <Link
                    href={'https://cloud.ibm.com/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    {'here'}
                  </Link>
                </p>
              </div>
            </div>
            <div className={classes.bottomDivider} />
            <div className={cx(classes.modelProviderContainer)}>
              <p className={cx(classes.modelProviderName)}>RITS</p>
              <div>
                <TextInput
                  id={'rits-api-key-input'}
                  labelText="API key"
                  value={modelProviderCredentials.rits.api_key}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setModelProviderCredentials({
                      ...modelProviderCredentials,
                      rits: { api_key: e.target.value },
                    })
                  }
                  autoComplete="off"
                  className={classes.credentialInput}
                />
                <p className="cds--form__helper-text">
                  {"Don't have a key? Get one "}
                  <Link
                    href={'https://rits.fmaas.res.ibm.com/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    {'here'}
                  </Link>
                </p>
              </div>
            </div>
            <div className={classes.bottomDivider} />
            <div className={cx(classes.modelProviderContainer)}>
              <p className={cx(classes.modelProviderName)}>OpenAI</p>
              <div>
                <TextInput
                  id={'openai-api-key-input'}
                  labelText="API key"
                  value={modelProviderCredentials['open-ai'].api_key}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setModelProviderCredentials({
                      ...modelProviderCredentials,
                      ['open-ai']: { api_key: e.target.value },
                    })
                  }
                  className={classes.credentialInput}
                  autoComplete="off"
                />
                <p className="cds--form__helper-text">
                  {"Don't have a key? Get one "}
                  <Link
                    href={'https://platform.openai.com/api-keys'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    {'here'}
                  </Link>
                </p>
              </div>
            </div>
            <div className={classes.bottomDivider} />
            <div className={cx(classes.modelProviderContainer)}>
              <p className={cx(classes.modelProviderName)}>OpenAI Compatible</p>
              <div className={classes.credentialsContainer}>
                <TextInput
                  id={'open-ai-like-api-key-input'}
                  labelText="API key"
                  value={modelProviderCredentials['open-ai-like'].api_key}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setModelProviderCredentials({
                      ...modelProviderCredentials,
                      'open-ai-like': { ...modelProviderCredentials['open-ai-like'], api_key: e.target.value },
                    })
                  }
                  className={classes.credentialInput}
                  autoComplete="off"
                />
                <TextInput
                  id={'open-ai-like-api-base-input'}
                  labelText="Base URL"
                  value={modelProviderCredentials['open-ai-like'].api_base}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setModelProviderCredentials({
                      ...modelProviderCredentials,
                      'open-ai-like': { ...modelProviderCredentials['open-ai-like'], api_base: e.target.value },
                    })
                  }
                  autoComplete="off"
                />
              </div>
            </div>
            <div className={classes.bottomDivider} />
            <div className={cx(classes.modelProviderContainer)}>
              <p className={cx(classes.modelProviderName)}>Azure</p>
              <div className={classes.credentialsContainer}>
                <TextInput
                  id={'azure-api-key-input'}
                  labelText="API key"
                  value={modelProviderCredentials.azure.api_key}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setModelProviderCredentials({
                      ...modelProviderCredentials,
                      azure: { ...modelProviderCredentials.azure, api_key: e.target.value },
                    })
                  }
                  autoComplete="off"
                  className={classes.credentialInput}
                />
                <TextInput
                  id={'azure-apibase-key-input'}
                  labelText="Base URL"
                  value={modelProviderCredentials.azure.api_base}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setModelProviderCredentials({
                      ...modelProviderCredentials,
                      azure: { ...modelProviderCredentials.azure, api_base: e.target.value },
                    })
                  }
                  autoComplete="off"
                  placeholder={defaultCrendentials.azure?.api_base}
                />
                <p className="cds--form__helper-text">
                  {"Don't have a key? Get one "}
                  <Link
                    href={
                      'https://learn.microsoft.com/en-us/azure/search/search-security-api-keys?tabs=rest-use%2Cportal-find%2Cportal-query'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    {'here'}
                  </Link>
                </p>
              </div>
            </div>
            <div className={classes.bottomDivider} />
            <div className={cx(classes.modelProviderContainer)}>
              <p className={cx(classes.modelProviderName)}>Together AI</p>
              <div>
                <TextInput
                  id={'together-ai-api-key-input'}
                  labelText="API key"
                  value={modelProviderCredentials['together-ai'].api_key}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setModelProviderCredentials({
                      ...modelProviderCredentials,
                      'together-ai': { api_key: e.target.value },
                    })
                  }
                  autoComplete="off"
                  className={classes.credentialInput}
                />
                <p className="cds--form__helper-text">
                  {"Don't have a key? Get one "}
                  <Link
                    href={'https://api.together.xyz/settings/api-keys'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    {'here'}
                  </Link>
                </p>
              </div>
            </div>
            <div className={classes.bottomDivider} />
            <div className={cx(classes.modelProviderContainer)}>
              <p className={cx(classes.modelProviderName)}>AWS/Bedrock</p>
              <div>
                <TextInput
                  id={'aws-api-key-input'}
                  labelText="API key"
                  value={modelProviderCredentials.aws.api_key}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setModelProviderCredentials({
                      ...modelProviderCredentials,
                      aws: { api_key: e.target.value },
                    })
                  }
                  autoComplete="off"
                  className={classes.credentialInput}
                />
                <p className="cds--form__helper-text">
                  {"Don't have a key? Get one "}
                  <Link
                    href={'https://docs.aws.amazon.com/bedrock/latest/userguide/getting-started-api.html'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    {'here'}
                  </Link>
                </p>
              </div>
            </div>
            <div className={classes.bottomDivider} />
            <div className={cx(classes.modelProviderContainer)}>
              <p className={cx(classes.modelProviderName)}>Vertex AI</p>
              <div>
                <TextInput
                  id={'aws-api-key-input'}
                  labelText="API key"
                  value={modelProviderCredentials['vertex-ai'].api_key}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setModelProviderCredentials({
                      ...modelProviderCredentials,
                      'vertex-ai': { api_key: e.target.value },
                    })
                  }
                  autoComplete="off"
                  className={classes.credentialInput}
                />
                <p className="cds--form__helper-text">
                  {"Don't have a key? Get one "}
                  <Link
                    href={
                      'https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    {'here'}
                  </Link>
                </p>
              </div>
            </div>
            <div className={classes.bottomDivider} />
            <div className={cx(classes.modelProviderContainer)}>
              <p className={cx(classes.modelProviderName)}>Replicate</p>
              <div>
                <TextInput
                  id={'replicate-api-key-input'}
                  labelText="API key"
                  value={modelProviderCredentials.replicate.api_key}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setModelProviderCredentials({
                      ...modelProviderCredentials,
                      replicate: { api_key: e.target.value },
                    })
                  }
                  autoComplete="off"
                  className={classes.credentialInput}
                />
                <p className="cds--form__helper-text">
                  {"Don't have a key? Get one "}
                  <Link
                    href={'https://replicate.com/account/api-tokens'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    {'here'}
                  </Link>
                </p>
              </div>
            </div>
            <div className={classes.bottomDivider} />
            <div className={cx(classes.modelProviderContainer)}>
              <p className={cx(classes.modelProviderName)}>Ollama</p>
              <div>
                <TextInput
                  id={'aws-api-key-input'}
                  labelText="Base URL"
                  value={modelProviderCredentials.ollama.api_base}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setModelProviderCredentials({
                      ...modelProviderCredentials,
                      ollama: { api_base: e.target.value },
                    })
                  }
                  autoComplete="off"
                  placeholder={defaultCrendentials.ollama?.api_base}
                />
                <p className="cds--form__helper-text">
                  {"Don't have a key? Get one "}
                  <Link
                    href={'https://replicate.com/account/api-tokens'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    {'here'}
                  </Link>
                </p>
              </div>
            </div>
          </FormGroup>
        </div>
      </ModalBody>

      <ModalFooter primaryButtonText="Accept" secondaryButtonText="Cancel" onRequestSubmit={() => setOpen(false)}>
        <></>
      </ModalFooter>
    </ComposedModal>
  )
}

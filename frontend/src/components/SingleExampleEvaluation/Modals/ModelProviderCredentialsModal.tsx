import cx from 'classnames'

import React, { Dispatch, SetStateAction } from 'react'

import { ComposedModal, Link, ModalBody, ModalFooter, ModalHeader, TextInput } from '@carbon/react'

import { useModelProviderCredentials } from '../Providers/ModelProviderCredentialsProvider'
import classes from './ModelProviderCredentialsModal.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const ModelProviderCredentialsModal = ({ open, setOpen }: Props) => {
  const { modelProviderCredentials, setModelProviderCredentials } = useModelProviderCredentials()
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
          <div className={cx(classes.modelProviderContainer)}>
            <p className={cx(classes.modelProviderName)}>Watsonx</p>
            <div className={classes.credentialsContainer}>
              <TextInput
                id={'watsonx-api-key-input'}
                labelText="API key"
                type="password"
                value={modelProviderCredentials.watsonx.api_key}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setModelProviderCredentials({
                    ...modelProviderCredentials,
                    watsonx: { ...modelProviderCredentials.watsonx, api_key: e.target.value },
                  })
                }
                className={classes.credential}
                autoComplete="off"
              />
              <TextInput
                id={'watsonx-project-id-input'}
                labelText="Project ID"
                value={modelProviderCredentials.watsonx.project_id}
                type="password"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setModelProviderCredentials({
                    ...modelProviderCredentials,
                    watsonx: { ...modelProviderCredentials.watsonx, project_id: e.target.value },
                  })
                }
                autoComplete="off"
                className={classes.credential}
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
                type="password"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setModelProviderCredentials({
                    ...modelProviderCredentials,
                    rits: { api_key: e.target.value },
                  })
                }
                autoComplete="off"
                className={classes.credential}
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
                type="password"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setModelProviderCredentials({
                    ...modelProviderCredentials,
                    ['open-ai']: { api_key: e.target.value },
                  })
                }
                autoComplete="off"
                className={classes.credential}
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
            <p className={cx(classes.modelProviderName)}>Azure OpenAI</p>
            <div>
              <TextInput
                id={'azure-api-key-input'}
                labelText="API key"
                value={modelProviderCredentials.azure.api_key}
                type="password"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setModelProviderCredentials({
                    ...modelProviderCredentials,
                    azure: { api_key: e.target.value },
                  })
                }
                autoComplete="off"
                className={classes.credential}
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
        </div>
      </ModalBody>

      <ModalFooter primaryButtonText="Accept" secondaryButtonText="Cancel" onRequestSubmit={() => setOpen(false)}>
        <></>
      </ModalFooter>
    </ComposedModal>
  )
}

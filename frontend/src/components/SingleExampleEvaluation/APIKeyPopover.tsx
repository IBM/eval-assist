import cx from 'classnames'

import { Dispatch, SetStateAction, useCallback, useEffect, useRef } from 'react'

import Link from 'next/link'

import { Button, Layer, Popover, PopoverContent, TextInput } from '@carbon/react'
import { WarningFilled } from '@carbon/react/icons'

import { ModelProviderCredentials } from '@types'

import classes from './APIKeyPopover.module.scss'

interface Props {
  popoverOpen: boolean
  setPopoverOpen: Dispatch<SetStateAction<boolean>>
  modelProviderCrentials: ModelProviderCredentials
  setModelProviderCredentials: Dispatch<SetStateAction<ModelProviderCredentials>>
  areRelevantCredentialsProvided: boolean
}

export const APIKeyPopover = ({
  popoverOpen,
  setPopoverOpen,
  modelProviderCrentials,
  setModelProviderCredentials,
  areRelevantCredentialsProvided,
}: Props) => {
  const apiKeyInputRef = useRef(null)

  useEffect(() => {
    if (popoverOpen && apiKeyInputRef.current !== null) (apiKeyInputRef as any).current.focus()
  }, [popoverOpen])

  return (
    <Popover open={popoverOpen} align="bottom-end" isTabTip onRequestClose={() => setPopoverOpen(false)}>
      <Button
        kind="tertiary"
        onClick={() => setPopoverOpen(!popoverOpen)}
        iconDescription="Set api key"
        renderIcon={!areRelevantCredentialsProvided ? WarningFilled : undefined}
      >
        {'API credentials'}
      </Button>
      <PopoverContent>
        <div style={{ padding: '1rem' }} className={classes['api-key-content-div']}>
          <h4 style={{ marginBottom: '0.75rem' }}>API credentials</h4>
          <p className={'cds--label'} style={{ marginBottom: '1rem' }}>
            Your credentials are only stored in your browser and are used solely to communicate directly to services.
          </p>
          <div className={classes.bottomDivider} />
          <div className={cx(classes.modelProvider)}>
            <p className={cx(classes.modelProviderName)}>Watsonx</p>
            <Layer>
              <div className={cx(classes.credential)}>
                <div className={cx(classes.credentialLabel, 'cds--label')}>API key: </div>
                <TextInput
                  ref={apiKeyInputRef}
                  id={'watsonx-api-key-input'}
                  labelText=""
                  value={modelProviderCrentials.watsonx.api_key}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setModelProviderCredentials({
                      ...modelProviderCrentials,
                      watsonx: { ...modelProviderCrentials.watsonx, api_key: e.target.value },
                    })
                  }
                  autoComplete="off"
                  className={classes['api-key-password-style']}
                />
              </div>
              <div className={cx(classes.credential)}>
                <div className={cx(classes.credentialLabel, 'cds--label')}>Project ID: </div>
                <TextInput
                  ref={apiKeyInputRef}
                  id={'watsonx-project-id-input'}
                  labelText=""
                  value={modelProviderCrentials.watsonx.project_id}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setModelProviderCredentials({
                      ...modelProviderCrentials,
                      watsonx: { ...modelProviderCrentials.watsonx, project_id: e.target.value },
                    })
                  }
                  autoComplete="off"
                  className={classes['api-key-password-style']}
                />
              </div>
            </Layer>
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
          <div className={classes.bottomDivider} />
          <div className={cx(classes.modelProvider)}>
            <p className={cx(classes.modelProviderName)}>RITS</p>
            <Layer>
              <div className={cx(classes.credential)}>
                <div className={cx(classes.credentialLabel, 'cds--label')}>API key: </div>
                <TextInput
                  ref={apiKeyInputRef}
                  id={'openai-api-key-input'}
                  labelText=""
                  value={modelProviderCrentials.rits.api_key}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setModelProviderCredentials({
                      ...modelProviderCrentials,
                      rits: { api_key: e.target.value },
                    })
                  }
                  autoComplete="off"
                  className={classes['api-key-password-style']}
                />
              </div>
            </Layer>
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
          <div className={classes.bottomDivider} />
          <div className={cx(classes.modelProvider)}>
            <p className={cx(classes.modelProviderName)}>OpenAI</p>
            <Layer>
              <div className={cx(classes.credential)}>
                <div className={cx(classes.credentialLabel, 'cds--label')}>API key: </div>
                <TextInput
                  ref={apiKeyInputRef}
                  id={'openai-api-key-input'}
                  labelText=""
                  value={modelProviderCrentials['open-ai'].api_key}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setModelProviderCredentials({
                      ...modelProviderCrentials,
                      ['open-ai']: { api_key: e.target.value },
                    })
                  }
                  autoComplete="off"
                  className={classes['api-key-password-style']}
                />
              </div>
            </Layer>
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
          <div className={classes.bottomDivider} />
          <div className={cx(classes.modelProvider)}>
            <p className={cx(classes.modelProviderName)}>Azure OpenAI</p>
            <Layer>
              <div className={cx(classes.credential)}>
                <div className={cx(classes.credentialLabel, 'cds--label')}>API key: </div>
                <TextInput
                  ref={apiKeyInputRef}
                  id={'openai-api-key-input'}
                  labelText=""
                  value={modelProviderCrentials.azure.api_key}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setModelProviderCredentials({
                      ...modelProviderCrentials,
                      azure: { api_key: e.target.value },
                    })
                  }
                  autoComplete="off"
                  className={classes['api-key-password-style']}
                />
              </div>
            </Layer>
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
      </PopoverContent>
    </Popover>
  )
}

import { Dispatch, LegacyRef, SetStateAction } from 'react'

import Link from 'next/link'

import { Button, Layer, Popover, PopoverContent, TextInput } from '@carbon/react'
import classes from '@styles/SingleExampleEvaluation.module.scss'

interface Props {
  popoverOpen: boolean
  setPopoverOpen: Dispatch<SetStateAction<boolean>>
  bamAPIKey: string | null
  setBamAPIKey: Dispatch<SetStateAction<string>>
}

export const APIKeyPopover = ({ popoverOpen, setPopoverOpen, bamAPIKey, setBamAPIKey }: Props) => {
  return (
    <Popover open={popoverOpen} align="bottom-end" isTabTip onRequestClose={() => setPopoverOpen(false)}>
      <Button kind="tertiary" onClick={() => setPopoverOpen(!popoverOpen)}>
        {'API key'}
      </Button>
      <PopoverContent>
        <div style={{ padding: '1rem' }} className={classes['api-key-content-div']}>
          <h4 style={{ marginBottom: '0.75rem' }}>API Key</h4>
          <p className={'cds--label'} style={{ marginBottom: '1rem' }}>
            Your API keys are only stored in your browser and are used solely to communicate directly to services.
          </p>
          <Layer>
            {/*@ts-ignore*/}
            <TextInput.PasswordInput
              id={'bam-api-key-input'}
              labelText="BAM API key"
              value={bamAPIKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBamAPIKey(e.target.value)}
            />
          </Layer>
          <p className="cds--form__helper-text">
            {"Don't have a key? Get one "}
            <Link
              href={'https://bam.res.ibm.com/'}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              {'here'}
            </Link>
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

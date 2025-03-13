import { Dispatch, SetStateAction, useCallback, useState } from 'react'

import { ComposedModal, ModalBody, ModalFooter, ModalHeader, RadioButton, RadioButtonGroup } from '@carbon/react'

import classes from './ChooseCodeGenerationType copy.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  downloadUnitxtCode: (options: { downloadAsScript: boolean }) => void
}

export const ChooseCodeGenerationType = ({ open, setOpen, downloadUnitxtCode }: Props) => {
  const [selectedFormat, setSelectedFormat] = useState<'ipynb' | 'py'>('ipynb')

  const onRequestSubmit = useCallback(() => {
    setOpen(false)
    downloadUnitxtCode({ downloadAsScript: selectedFormat === 'py' })
  }, [selectedFormat, downloadUnitxtCode, setOpen])

  return (
    <ComposedModal open={open} onClose={() => setOpen(false)}>
      <ModalHeader title="Download Sample Code" />
      <ModalBody>
        <p className={classes.descriptionPadding}>Select the format in which you want to download the sample code:</p>
        <RadioButtonGroup
          name="file-format"
          valueSelected={selectedFormat}
          onChange={(value: string | undefined | number) => setSelectedFormat(value as 'ipynb' | 'py')}
        >
          <RadioButton id="ipynb" labelText="Jupyter Notebook (.ipynb)" value="ipynb" />
          <RadioButton id="py" labelText="Python Script (.py)" value="py" />
        </RadioButtonGroup>
      </ModalBody>
      <ModalFooter primaryButtonText="Download" secondaryButtonText="Cancel" onRequestSubmit={onRequestSubmit}>
        <></>
      </ModalFooter>
    </ComposedModal>
  )
}

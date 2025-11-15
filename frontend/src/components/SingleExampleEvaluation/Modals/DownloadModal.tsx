import cx from 'classnames'

import { Dispatch, SetStateAction, useCallback, useState } from 'react'

import {
  ComposedModal,
  Layer,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  RadioButton,
  RadioButtonGroup,
} from '@carbon/react'

import { useDownloadTestCase } from '@customHooks/useDownloadTestCase'
import { useDownloadTestData } from '@customHooks/useDownloadTestData'
import { useUnitxtCodeGeneration } from '@customHooks/useNotebookGeneration'

import classes from './DownloadModal.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const DownloadModal = ({ open, setOpen }: Props) => {
  const [selected, setSelected] = useState<'ipynb' | 'py' | 'test_case' | 'test_data'>('ipynb')
  const { downloadUnitxtCode } = useUnitxtCodeGeneration()
  const { downloadTestCase } = useDownloadTestCase()
  const { downloadTestData } = useDownloadTestData()

  const onRequestSubmit = useCallback(() => {
    setOpen(false)
    if (['ipynb', 'py'].includes(selected)) {
      downloadUnitxtCode({ downloadAsScript: selected === 'py' })
    } else if (selected === 'test_case') {
    } else {
    }
  }, [setOpen, selected, downloadUnitxtCode])

  return (
    <Modal
      open={open}
      onRequestClose={() => setOpen(false)}
      modalHeading={`Test case configuration`}
      primaryButtonText="Download"
      secondaryButtonText="Cancel"
      onRequestSubmit={onRequestSubmit}
      shouldSubmitOnEnter
    >
      <Layer type={'outline'}>
        <div className={classes.container}>
          <div className={classes.section}>
            <h5>{'Download Sample Code'}</h5>
            <p className={classes.descriptionPadding}>
              Select the format in which you want to download the sample code
            </p>
            <RadioButtonGroup
              name="file-format"
              valueSelected={selected}
              onChange={(value: string | undefined | number) => setSelected(value as 'ipynb' | 'py')}
            >
              <RadioButton id="ipynb" labelText="Jupyter Notebook (.ipynb)" value="ipynb" />
              <RadioButton id="py" labelText="Python Script (.py)" value="py" />
            </RadioButtonGroup>
          </div>
          <div className={classes.section}>
            <h5>{'Download Test Case'}</h5>
            <p className={classes.descriptionPadding}>
              Download the test case as a json file, including criteria, examples, configuration and test data.
            </p>
            <RadioButtonGroup
              name="file-format"
              valueSelected={selected}
              onChange={(value: string | undefined | number) => setSelected(value as 'test_case')}
            >
              <RadioButton id="test_case" labelText="Test Case (.json)" value="test_case" />
            </RadioButtonGroup>
          </div>
          <div className={classes.section}>
            <h5>{'Download Test Data'}</h5>
            <p className={classes.descriptionPadding}>
              Download the test case as a json file, including criteria, examples, configuration and test data.
            </p>
            <RadioButtonGroup
              name="file-format"
              valueSelected={selected}
              onChange={(value: string | undefined | number) => setSelected(value as 'test_data')}
            >
              <RadioButton id="test_data" labelText="Test Data (.csv)" value="testdata" />
            </RadioButtonGroup>
          </div>
        </div>
      </Layer>
    </Modal>
  )
}

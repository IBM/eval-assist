import cx from 'classnames'
import { readJsonFile, toTitleCase } from 'src/utils'

import { Dispatch, SetStateAction, useState } from 'react'

import { FileUploader, Layer, Modal } from '@carbon/react'

import { CriteriaInfo } from '@components/CriteriaInfo'
import { useParseFetchedTestCase } from '@customHooks/useParseFetchedTestCase'
import { useTestCaseActionsContext } from '@providers/TestCaseActionsProvider'
import { useUserTestCasesContext } from '@providers/UserTestCasesProvider'
import { TestCase } from '@types'

import classes from './ImportTestCaseModal.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const UploadTestCaseModal = ({ open, setOpen }: Props) => {
  const [file, setFile] = useState<File | null>(null)
  const [toUploadTestCase, setToUploadTestCase] = useState<TestCase | null>(null)
  const { parseFetchedTestCase } = useParseFetchedTestCase()
  const { onSaveAs } = useTestCaseActionsContext()
  const { userTestCases } = useUserTestCasesContext()
  const [hasWrongFormat, setHasWrongFormat] = useState(false)
  const [wrongFormatMessage, setWrongFormatMessage] = useState('')

  const onSubmit = async () => {
    if (toUploadTestCase === null) return
    onSaveAs(toUploadTestCase.name, toUploadTestCase)
    resetStatus()
  }

  const cleanState = () => {
    setFile(null)
    setToUploadTestCase(null)
    setHasWrongFormat(false)
    setWrongFormatMessage('')
  }

  const resetStatus = () => {
    cleanState()
    setOpen(false)
  }

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setFile(file)
    let uploadedTestCase
    try {
      uploadedTestCase = await readJsonFile(file)
    } catch (err) {
      setHasWrongFormat(true)
      setWrongFormatMessage('The json file is invalid.')
      return
    }
    let parsedTestCase: TestCase
    try {
      parsedTestCase = parseFetchedTestCase(uploadedTestCase)
    } catch (err) {
      setHasWrongFormat(true)
      setWrongFormatMessage(
        `Could not parse the test case according to the format that EvalAssist expects. ${String(err)}`,
      )
      return
    }
    parsedTestCase.id = null
    if (!parsedTestCase.name) {
      parsedTestCase.name = 'Untitled test case'
    }
    // set a name that is not reperated
    let i = 2
    const baseName = parsedTestCase.name
    let proposedName = baseName

    while (userTestCases.some((t) => t.name === proposedName)) {
      proposedName = `${baseName} ${i}`
      i += 1
    }
    parsedTestCase.name = proposedName
    setToUploadTestCase(parsedTestCase)
  }

  const onDelete = () => {
    setFile(null)
    setToUploadTestCase(null)
  }

  return (
    <Modal
      open={open}
      onRequestClose={resetStatus}
      modalHeading={`Import Test Case`}
      primaryButtonText="Upload"
      secondaryButtonText="Cancel"
      onRequestSubmit={onSubmit}
      shouldSubmitOnEnter
      primaryButtonDisabled={toUploadTestCase === null}
      className={cx(classes['bottom-padding'], classes.root)}
    >
      <Layer type={'outline'}>
        <div className={cx('cds--file__container')}>
          <FileUploader
            accept={['.json']}
            buttonKind="primary"
            buttonLabel="Select file"
            filenameStatus="edit"
            iconDescription="Delete file"
            labelDescription={'Select a json file that was downloaded from EvalAssist'}
            labelTitle="Import test case from file"
            name=""
            onChange={onChange}
            onDelete={onDelete}
            size="md"
          />
        </div>
        {hasWrongFormat && <div>{wrongFormatMessage}</div>}
        {toUploadTestCase !== null && (
          <div className={classes.uploadTestCaseDetailsContainer}>
            <h3>{'Test case preview'}</h3>
            <p>
              <strong>{'Name: '}</strong>
              {toUploadTestCase.name}
            </p>
            <p>
              <strong>{'Number of instances: '}</strong>
              {toUploadTestCase.instances.length}
            </p>
            {toUploadTestCase.evaluator !== null && (
              <p>
                <strong>{'Evaluator: '}</strong>
                {toUploadTestCase.evaluator.name}
              </p>
            )}
            <p>
              <strong>{'Type: '}</strong>
              {toTitleCase(toUploadTestCase.type)}
            </p>
            <div className={classes.criteriaContainer}>
              <h4>{`Criteria: ${toUploadTestCase.criteria.name}`}</h4>
              <CriteriaInfo criteria={toUploadTestCase.criteria} includeName={false} />
            </div>
          </div>
        )}
      </Layer>
    </Modal>
  )
}

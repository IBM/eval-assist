import cx from 'classnames'
import Papa from 'papaparse'
import { generateId, readCsvFile, returnByPipelineType } from 'src/utils'

import { Dispatch, SetStateAction, useMemo, useState } from 'react'

import { FileUploader, Layer, Modal } from '@carbon/react'

import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { EvaluationType, Instance, PairwiseInstance } from '@types'

import classes from './ImportTestDataModal.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const UploadTestDataModal = ({ open, setOpen }: Props) => {
  const [file, setFile] = useState<File | null>(null)
  const [toUploadTestData, setToUploadTestData] = useState<Instance[] | null>(null)
  const { currentTestCase, setCurrentTestCase } = useCurrentTestCase()
  const [hasWrongFormat, setHasWrongFormat] = useState(false)
  const [wrongFormatMessage, setWrongFormatMessage] = useState('')

  const onSubmit = async () => {
    if (toUploadTestData === null) return
    setToUploadTestData(null)
    setCurrentTestCase({
      ...currentTestCase,
      instances: [...currentTestCase.instances, ...toUploadTestData],
    })
    resetStatus()
  }

  const cleanState = () => {
    setFile(null)
    setToUploadTestData(null)
    setHasWrongFormat(false)
    setWrongFormatMessage('')
  }

  const resetStatus = () => {
    cleanState()
    setOpen(false)
  }

  const requiredResponseFields = useMemo(
    () =>
      returnByPipelineType(
        currentTestCase.type,
        () => [currentTestCase.criteria.predictionField],
        () =>
          new Array((currentTestCase.instances[0] as PairwiseInstance).responses.length)
            .fill(null)
            .map((_, i) => `${currentTestCase.criteria.predictionField} ${i + 1}`),
      ),
    [currentTestCase.criteria.predictionField, currentTestCase.instances, currentTestCase.type],
  )

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setFile(file)
    let instancesAsDict: Record<string, string>[] | null = null
    let failed = false
    try {
      // Optionally specify the expected JSON structure with a custom type
      instancesAsDict = await readCsvFile<Record<string, string>>(file)
    } catch (err) {
      setHasWrongFormat(true)
      setWrongFormatMessage(`Failed reading the csv. ${(err as Papa.ParseError[])[0].message}`)
    } finally {
      if (instancesAsDict === null) {
        return
      }
    }
    const csvColumnNames = Object.keys(instancesAsDict[0])
    const missingFields: string[] = []

    // check that the csv contains all the context fields
    for (const context_field of currentTestCase.criteria.contextFields) {
      if (!csvColumnNames.includes(context_field)) {
        failed = true
        missingFields.push(context_field)
      }
    }
    // check that csv contains the prediction field
    for (const requiredResponseField of requiredResponseFields) {
      if (!csvColumnNames.includes(requiredResponseField)) {
        failed = true
        missingFields.push(requiredResponseField)
      }
    }

    if (failed) {
      setWrongFormatMessage(
        `The uploaded file has a wrong format. The following columns are missing: ${missingFields
          .map((s) => `'${s}'`)
          .join(', ')}.`,
      )
      setHasWrongFormat(true)
      return
    }
    setHasWrongFormat(false)

    const instances: Instance[] = []
    // refactor this check, if done from the first row it is not required for all rows
    for (const unparsedInstance of instancesAsDict) {
      // check if it has all the required keys
      const instanceResponses = requiredResponseFields.map(
        (requiredResponseField) => unparsedInstance[requiredResponseField],
      )
      let instance: Instance = {
        id: generateId(),
        contextVariables: currentTestCase.criteria.contextFields.map((contextField) => ({
          name: contextField,
          value: unparsedInstance[contextField]!, // already checked so we use !,
        })),
        expectedResult: unparsedInstance['expected_result'] || '',
        result: null,
        [returnByPipelineType(currentTestCase.type, 'response', 'responses')]: returnByPipelineType(
          currentTestCase.type,
          instanceResponses[0],
          instanceResponses,
        ),
      }
      instances.push(instance)
    }
    setToUploadTestData(instances)
  }

  // const indicationsList = useMemo(() => {
  //   const indications = []
  //   indications.push('The uploaded file must be a csv.')
  //   if (currentTestCase.type === EvaluationType.DIRECT) {
  //     indications.push(`Include a column response field names ${currentTestCase.criteria.predictionField}`)
  //   } else {
  //     indications.push(`Include a column for each response field: ${requiredResponseFields.join(', ')}.`)
  //   }
  //   if (currentTestCase.criteria.contextFields.length) {
  //     indications.push(
  //       `Include a column for each context variable: ${currentTestCase.criteria.contextFields.join(', ')}`,
  //     )
  //   }
  //   return indications
  // }, [
  //   currentTestCase.criteria.contextFields,
  //   currentTestCase.criteria.predictionField,
  //   currentTestCase.type,
  //   requiredResponseFields,
  // ])

  return (
    <Modal
      open={open}
      onRequestClose={resetStatus}
      modalHeading={`Import Test Case`}
      primaryButtonText="Upload"
      secondaryButtonText="Cancel"
      onRequestSubmit={onSubmit}
      shouldSubmitOnEnter
      primaryButtonDisabled={toUploadTestData === null}
      className={cx(classes['bottom-padding'], classes.root)}
    >
      <Layer type={'outline'}>
        <div className={cx('cds--file__container')}>
          <FileUploader
            accept={['.csv']}
            buttonKind="primary"
            buttonLabel="Select file"
            filenameStatus="edit"
            iconDescription="Delete file"
            labelDescription={`Select a csv file with the following columns: ${[
              ...requiredResponseFields,
              ...currentTestCase.criteria.contextFields,
            ]
              .map((s) => `'${s}'`)
              .join(', ')}.`}
            labelTitle="Import test data from file"
            name=""
            onChange={onChange}
            size="md"
          />
        </div>
        {(toUploadTestData || hasWrongFormat) && (
          <div className={classes.testDataMessageContainer}>
            {hasWrongFormat ? (
              <div>{wrongFormatMessage}</div>
            ) : toUploadTestData ? (
              <div>{`Uploaded test data has the correct format. ${toUploadTestData.length} instances will be uploaded.`}</div>
            ) : null}
          </div>
        )}
      </Layer>
    </Modal>
  )
}

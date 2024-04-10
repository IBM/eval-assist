import { ChangeEvent, useEffect, useMemo, useState } from 'react'

import {
  Button,
  FileUploader,
  IconButton,
  InlineLoading,
  MenuItemDivider,
  ProgressBar,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tooltip,
} from '@carbon/react'
import { Close, CloudUpload, Download, Information } from '@carbon/react/icons'
import classes from '@styles/DataUpload.module.scss'

import { Evaluation } from '@prisma/client'
import { post } from '@utils/fetchUtils'

interface Props {
  evaluation: Evaluation
}

export const DataUpload = ({ evaluation }: Props) => {
  const [file, setFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [fileUploaded, setFileUploaded] = useState(false)
  const [error, setError] = useState(null)
  const fileSelected = useMemo(() => file !== null, [file])

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files
    const selectedFile = files !== null ? files[0] : null
    setFile(selectedFile)
    onSubmit(selectedFile)
  }

  const onSubmit = async (file: File | null) => {
    if (file === null) return
    setError(null)
    let formData = new FormData()
    formData.append('file', file)
    setUploadingFile(true)
    const res = await post(`evaluation/${evaluation.id}/upload_data`, formData)
    const resBody = await res.json()
    if (res.ok) {
    } else {
      setError(resBody.detail)
    }
    setFileUploaded(true)
    setUploadingFile(false)
  }

  const onRemoveFile = () => {
    setFile(null)
    setFileUploaded(false)
  }

  return (
    <Tabs>
      <TabList aria-label="List of tabs" contained>
        <Tab style={{ backgroundColor: 'white', borderLeft: '1px solid #dfdfdf' }}>Data upload</Tab>
        <Tab disabled>Generator</Tab>
      </TabList>
      <TabPanels>
        <TabPanel style={{ padding: 0, border: '1px solid #dfdfdf', marginTop: '-1px' }}>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white',
                width: '30%',
                padding: '1rem',
              }}
            >
              <ol style={{ backgroundColor: '#D0E2FF', padding: '1rem', marginBottom: '1rem' }}>
                <li style={{ marginBottom: '0.5rem' }} className={classes['list-item']}>
                  {'1. We currently only support .csv format'}
                </li>
                <li className={classes['list-item']}>
                  {'2. Please ensure that your file has the correct and required column headers as shown below'}
                </li>
              </ol>
              <h5 style={{ color: '#525252', fontWeight: 400 }}>REQUIRED COLUMNS</h5>
              <MenuItemDivider />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '0.75rem',
                  marginBottom: '0.75rem',
                }}
              >
                <p>{'config'}</p>
                <Tooltip label={''}>
                  <Information />
                </Tooltip>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <p>{'model_output'}</p>
                <Tooltip label={''}>
                  <Information />
                </Tooltip>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <p>{'context_<variable>'}</p>
                <Tooltip label={''}>
                  <Information />
                </Tooltip>
              </div>
              <Button kind="ghost" renderIcon={Download} style={{ paddingLeft: 0 }}>
                Download template & Sample data
              </Button>
            </div>
            <div style={{ width: '70%' }}>
              {!(uploadingFile || fileUploaded) ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CloudUpload size={200} strokeWidth={'5'} />
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      marginLeft: '2rem',
                    }}
                  >
                    <FileUploader
                      style={{ flex: '0 0 auto' }}
                      // labelTitle="Browse from your computer"
                      labelDescription="We currently only support .CSV format."
                      buttonLabel={'Browse from your computer'}
                      buttonKind="tertiary"
                      size="md"
                      filenameStatus="edit"
                      accept={['.csv']}
                      multiple={false}
                      disabled={false}
                      iconDescription="Delete file"
                      name=""
                      onChange={onFileChange}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <div style={{ display: 'flex', flexDirection: 'row', width: '100%', marginInline: '2rem' }}>
                    <div style={{ width: '97%', marginRight: '0.5rem' }}>
                      <ProgressBar
                        label={(file as File).name}
                        helperText={error ? error : ''}
                        status={!fileUploaded ? 'active' : error === null ? 'finished' : 'error'}
                      />
                    </div>
                    <IconButton kind={'ghost'} size="sm" label="Delete" align="bottom" onClick={onRemoveFile}>
                      <Close size={20} />
                    </IconButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}

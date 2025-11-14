import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'

import { IconButton, Modal, TextArea, TextAreaSkeleton } from '@carbon/react'
import { Reset } from '@carbon/react/icons'

import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useTestCaseActionsContext } from '@providers/TestCaseActionsProvider'
import { useToastContext } from '@providers/ToastProvider'
import { DirectInstance } from '@types'
import { getPromptDiff } from '@utils'

import classes from './FixInstanceModal.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const FixInstanceModal = ({ open, setOpen }: Props) => {
  const { addToast } = useToastContext()
  const { currentTestCase, setCurrentTestCase } = useCurrentTestCase()
  const { fixInstance, fixingInstanceId, setFixingInstanceId } = useTestCaseActionsContext()
  const toFixInstance = useMemo(
    () => currentTestCase.instances.find((instance) => instance.id === fixingInstanceId) || null,
    [currentTestCase.instances, fixingInstanceId],
  )
  const [fixedText, setFixedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [diff, setDiff] = useState<any>(null)

  const onSubmit = useCallback(() => {
    if (fixingInstanceId === null) return
    setOpen(false)
    setFixingInstanceId(null)
    setFixedText('')
    setCurrentTestCase(() => {
      // used to filter the instances to update if one or more instances were deleted while the evaluation was running
      const instances: DirectInstance[] = (currentTestCase.instances as DirectInstance[]).map(
        (instance: DirectInstance) => ({
          ...instance,
          response: instance.id === fixingInstanceId ? fixedText : instance.response,
        }),
      )
      return {
        ...currentTestCase,
        instances: instances,
      }
    })
  }, [currentTestCase, fixedText, fixingInstanceId, setCurrentTestCase, setFixingInstanceId, setOpen])

  const onFixInstance = useCallback(async () => {
    if (fixingInstanceId === null) return
    setLoading(true)
    const res = await fixInstance(fixingInstanceId)
    if (res === null) {
      const fixingInProgressToastId = addToast({
        kind: 'info',
        title: 'Fixing instance failed',
      })
    } else {
      setFixedText(res)
      setDiff(getPromptDiff((toFixInstance as DirectInstance).response, res))
    }
    setLoading(false)
  }, [addToast, fixInstance, fixingInstanceId, toFixInstance])

  useEffect(() => {
    onFixInstance()
  }, [onFixInstance])

  if (toFixInstance === null) {
    return
  }

  return (
    <Modal
      open={open}
      onRequestClose={() => setOpen(false)}
      modalHeading={`Fix instance based on judge feedback`}
      primaryButtonText="Apply fix"
      primaryButtonDisabled={fixingInstanceId === null || loading}
      secondaryButtonText="Cancel"
      onRequestSubmit={onSubmit}
      shouldSubmitOnEnter
    >
      <div className={classes.container}>
        <TextArea
          enableCounter
          id="text-area-1"
          labelText="To fix instance"
          readOnly
          value={(toFixInstance as DirectInstance).response}
        />

        {/* <TextArea
          enableCounter
          id="feedback"
          labelText="Feedbak"
          readOnly
          value={(toFixInstance.result as DirectInstanceResult).feedback}
        /> */}
        {fixedText && !loading ? (
          <div className={classes.fixedSectionContainer}>
            <div className={classes.fixedTextContainer}>
              <p className={'cds--label'}>{'Fixed text'}</p>
              <div>
                {diff.map((e: any, j: number) => {
                  return (
                    <span key={j} className={e.added ? classes.added : e.removed ? classes.removed : undefined}>
                      {e.value}
                    </span>
                  )
                })}
              </div>
            </div>
            <IconButton className={classes.iconButton} kind={'ghost'} label={'Retry'} onMouseDown={onFixInstance}>
              <Reset />
            </IconButton>
          </div>
        ) : (
          <div className={classes.skeletonContainer}>
            <p className={'cds--label'}>{'Fixing text...'}</p>
            <TextAreaSkeleton hideLabel />
          </div>
        )}
      </div>
    </Modal>
  )
}

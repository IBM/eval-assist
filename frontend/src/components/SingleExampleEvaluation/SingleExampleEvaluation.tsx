import cx from 'classnames'
import { useLocalStorage } from 'usehooks-ts'

import { LegacyRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useRouter } from 'next/router'

import { TextArea } from '@carbon/react'

import { useToastContext } from '@components/ToastProvider/ToastProvider'
import { useAuthentication } from '@customHooks/useAuthentication'
import { useBeforeOnload } from '@customHooks/useBeforeOnload'
import { StoredUseCase } from '@prisma/client'
import { deleteCustom, post, put } from '@utils/fetchUtils'
import { getEmptyRubric, getEmptyUseCase, parseFetchedUseCase } from '@utils/utils'

import { APIKeyPopover } from './APIKeyPopover'
import { AppSidenavNew } from './AppSidenav/AppSidenav'
import { EvaluateButton } from './EvaluateButton'
import { EvaluationCriteria } from './EvaluationCriteria'
import { EvaluationResults } from './EvaluationResults'
import layoutClasses from './Layout.module.scss'
import { DeleteUseCaseModal } from './Modals/DeleteUseCaseModal'
import { EditUseCaseNameModal } from './Modals/EditUseCaseNameModal'
import { NewUseCaseModal } from './Modals/NewUseCaseModal'
import { SaveAsUseCaseModal } from './Modals/SaveAsUseCaseModal'
import { SwitchUseCaseModal } from './Modals/SwitchUseCaseModal'
import { Responses } from './Responses'
import classes from './SingleExampleEvaluation.module.scss'
import { UseCaseOptions } from './UseCaseOptions'
import { FetchedResults, Result, Rubric, UseCase } from './types'

export interface SingleExampleEvaluationProps {
  _userUseCases: UseCase[]
  currentUseCase: UseCase | null
}

export const SingleExampleEvaluation = ({ _userUseCases, currentUseCase }: SingleExampleEvaluationProps) => {
  // we are ignoring client side rendering to be able to use useSessionStorage
  const [libraryUseCaseSelected, setLibraryUseCaseSelected] = useState<UseCase | null>(currentUseCase)
  // if the usecase doesnt have an id, it means it hasn't been stored
  const [id, setId] = useState<number | null>(currentUseCase ? currentUseCase.id : null)
  const [name, setName] = useState(currentUseCase ? currentUseCase.name : '')
  const [context, setContext] = useState(currentUseCase ? currentUseCase.context : '')
  const [responses, setResponses] = useState(currentUseCase ? currentUseCase.responses : [''])
  const [rubric, setRubric] = useState<Rubric>(currentUseCase ? currentUseCase.rubric : getEmptyRubric())
  const [results, setResults] = useState<Result[] | null>(currentUseCase ? currentUseCase.results : null)

  const [userUseCases, setUserUseCases] = useState(_userUseCases)

  const isUseCaseSaved = useMemo(() => id !== null, [id])
  const [evaluationFailed, setEvaluationFailed] = useState(false)
  const [evaluationError, setEvaluationError] = useState<string>('')

  const [evaluationRunning, setEvaluationRunning] = useState(false)

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false)
  const [saveUseCaseModalOpen, setSaveUseCaseModalOpen] = useState(false)
  const [newUseCaseModalOpen, setNewUseCaseModalOpen] = useState(false)
  const [deleteUseCaseModalOpen, setDeleteUseCaseModalOpen] = useState(false)
  const [editNameModalOpen, setEditNameModalOpen] = useState(false)

  const [popoverOpen, setPopoverOpen] = useState(false)

  const [sidebarTabSelected, setSidebarTabSelected] = useState<'user_use_cases' | 'library_use_cases' | null>(null)

  const getUseCaseFromState = useCallback((): UseCase => {
    return {
      id,
      name,
      context,
      responses,
      rubric,
      results,
    }
  }, [id, name, context, responses, rubric, results])

  const [lastSavedUseCaseString, setLastSavedUseCase] = useState<string>(JSON.stringify(getUseCaseFromState()))

  const currentUseCaseString = useMemo<string>(() => {
    return JSON.stringify(getUseCaseFromState())
  }, [getUseCaseFromState])

  const changesDetected = useMemo(
    () => lastSavedUseCaseString !== currentUseCaseString,
    [lastSavedUseCaseString, currentUseCaseString],
  )

  const [bamAPIKey, setBamAPIKey, removeBamAPIKey] = useLocalStorage<string>('bamAPIKey', '')

  const popoverRef = useRef<HTMLDivElement>()

  const router = useRouter()

  const { getUserName } = useAuthentication()

  const { addToast } = useToastContext()

  useBeforeOnload(changesDetected)

  const runEvaluation = async () => {
    setEvaluationFailed(false)
    setEvaluationRunning(true)
    setResults(null)
    const response = await post('evaluate/', {
      context,
      responses,
      rubric,
      bam_api_key: bamAPIKey,
    })

    setEvaluationRunning(false)

    if (!response.ok) {
      const error = (await response.json()) as {
        detail: string
      }
      setEvaluationFailed(true)
      // We are catching this error an so we show the message sent from the backend
      setEvaluationError(error.detail)

      addToast({
        kind: 'error',
        title: 'Evaluation failed',
      })

      return
    }

    const responseBody = (await response.json()) as FetchedResults

    addToast({
      kind: 'success',
      title: 'Evaluation finished',
      timeout: 5000,
    })

    setResults(
      responseBody.results.map((result) => ({
        name: rubric.title,
        option: result.option,
        explanation: result.explanation,
        positionalBias: result.p_bias,
      })),
    )
  }

  const setCurrentUseCase = (useCase: UseCase) => {
    let urlChangePromise: Promise<boolean>

    if (useCase.id !== null) {
      urlChangePromise = changeUseCaseURL(useCase.id)
    } else {
      urlChangePromise = changeUseCaseURL(null)
    }

    urlChangePromise.then(() => {
      setContext(useCase.context)
      setResponses(useCase.responses)
      setRubric(useCase.rubric)
      setName(useCase.name)
      setId(useCase.id)
      setResults(useCase.results)
      setLastSavedUseCase(JSON.stringify(useCase))
    })
  }

  const changeUseCaseURL = useCallback(
    (useCaseId: number | null) => {
      if (useCaseId !== null) {
        return router.push({ pathname: '/', query: { id: useCaseId } }, `/?id=${useCaseId}`, {
          shallow: true,
        })
      } else {
        return router.push({ pathname: '/' }, `/`, { shallow: true })
      }
    },
    [router],
  )

  const onSave = async () => {
    const savedUseCase: StoredUseCase = await (
      await put('use_case/', {
        use_case: {
          name,
          content: JSON.stringify({
            context,
            responses,
            rubric,
            results,
          }),
          user_id: -1,
          id: id,
        } as StoredUseCase,
        user: getUserName(),
      })
    ).json()

    const parsedSavedUseCase = parseFetchedUseCase(savedUseCase)

    // update use case in the use cases list
    const i = userUseCases.findIndex((useCase) => useCase.id === id)
    setUserUseCases([...userUseCases.slice(0, i), parsedSavedUseCase, ...userUseCases.slice(i + 1)])

    // update lastSavedUseCase
    setLastSavedUseCase(JSON.stringify(getUseCaseFromState()))

    // notify the user
    addToast({
      kind: 'success',
      title: `Test case saved`,
      timeout: 5000,
    })
  }

  const onSaveAs = async (useCaseName: string) => {
    const savedUseCase: StoredUseCase = await (
      await put('use_case/', {
        use_case: {
          name: useCaseName,
          content: JSON.stringify({
            context,
            responses,
            rubric,
            results,
          }),
          user_id: -1,
          id: -1,
        } as StoredUseCase,
        user: getUserName(),
      })
    ).json()

    const parsedSavedUseCase = parseFetchedUseCase(savedUseCase)
    setCurrentUseCase(parsedSavedUseCase)
    setUserUseCases([...userUseCases, parsedSavedUseCase])
    changeUseCaseURL(parsedSavedUseCase.id)

    // notify the user
    addToast({
      kind: 'success',
      title: `Created use case '${parsedSavedUseCase.name}'`,
      timeout: 5000,
    })
  }

  const onDeleteUseCase = async () => {
    await deleteCustom('use_case/', { use_case_id: id })

    // notify the user
    addToast({
      kind: 'success',
      title: `Deleted use case '${name}'`,
      timeout: 5000,
    })

    setUserUseCases(userUseCases.filter((u) => u.id !== id))
    setCurrentUseCase(getEmptyUseCase())
    changeUseCaseURL(null)
  }

  return (
    <>
      <AppSidenavNew
        setConfirmationModalOpen={setConfirmationModalOpen}
        setLibraryUseCaseSelected={setLibraryUseCaseSelected}
        userUseCases={userUseCases}
        currentUseCaseId={id}
        selected={sidebarTabSelected}
        setSelected={setSidebarTabSelected}
        changesDetected={changesDetected}
        setCurrentUseCase={setCurrentUseCase}
      />
      <div className={cx(layoutClasses['main-content'], classes.body)}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '1rem',
            marginBottom: '1rem',
          }}
          ref={popoverRef as LegacyRef<HTMLDivElement> | undefined}
          className={`${classes['bottom-divider']} ${classes['left-padding']}`}
        >
          <h3>Evaluation sandbox</h3>

          <APIKeyPopover
            popoverOpen={popoverOpen}
            setPopoverOpen={setPopoverOpen}
            bamAPIKey={bamAPIKey}
            setBamAPIKey={setBamAPIKey}
          />
        </div>
        <UseCaseOptions
          style={{ marginBottom: '1rem' }}
          className={classes['left-padding']}
          testCaseName={name}
          isUseCaseSaved={isUseCaseSaved}
          onSave={onSave}
          useCaseName={name}
          setUseCaseName={setName}
          changesDetected={changesDetected}
          setNewUseCaseModalOpen={setNewUseCaseModalOpen}
          setDeleteUseCaseModalOpen={setDeleteUseCaseModalOpen}
          setSaveUseCaseModalOpen={setSaveUseCaseModalOpen}
          setEditNameModalOpen={setEditNameModalOpen}
          setCurrentUseCase={setCurrentUseCase}
        />
        <EvaluationCriteria
          className={classes['left-padding']}
          rubric={rubric}
          setRubric={setRubric}
          style={{ marginBottom: '1rem' }}
        />
        <div style={{ marginBottom: '1rem' }} className={`${classes['left-padding']} cds--accordion-title`}>
          Test data
        </div>
        <TextArea
          onChange={(e) => setContext(e.target.value)}
          rows={4}
          value={context}
          id="text-area-context"
          labelText="Task context (optional)"
          style={{ marginBottom: '1rem' }}
          placeholder="Context information relevant to the evaluation such as prompt, data variables etc."
          className={classes['left-padding']}
        />

        <Responses
          responses={responses}
          setResponses={setResponses}
          style={{ marginBottom: '2rem' }}
          className={classes['left-padding']}
        />

        <EvaluateButton
          evaluationRunning={evaluationRunning}
          runEvaluation={runEvaluation}
          style={{ marginBottom: '1rem' }}
          className={classes['left-padding']}
        />
        {bamAPIKey === '' && !evaluationRunning && results === null && !evaluationFailed && (
          <p className={`${classes['left-padding']} ${classes['api-key-reminder-text']}`}>
            {'You will need to provide your BAM API key to run the evaluation'}
          </p>
        )}
        <EvaluationResults
          className={classes['left-padding']}
          results={results}
          evaluationFailed={evaluationFailed}
          evaluationError={evaluationError}
          evaluationRunning={evaluationRunning}
          style={{ marginBottom: '1rem' }}
        />
      </div>
      <SwitchUseCaseModal
        setCurrentUseCase={setCurrentUseCase}
        open={confirmationModalOpen}
        setOpen={setConfirmationModalOpen}
        selectedUseCase={libraryUseCaseSelected}
      />
      <SaveAsUseCaseModal open={saveUseCaseModalOpen} setOpen={setSaveUseCaseModalOpen} onSaveAs={onSaveAs} />
      <NewUseCaseModal
        open={newUseCaseModalOpen}
        setOpen={setNewUseCaseModalOpen}
        setCurrentUseCase={setCurrentUseCase}
      />
      <DeleteUseCaseModal
        open={deleteUseCaseModalOpen}
        setOpen={setDeleteUseCaseModalOpen}
        onDeleteUseCase={onDeleteUseCase}
        useCaseName={name}
      />
      <EditUseCaseNameModal
        open={editNameModalOpen}
        setOpen={setEditNameModalOpen}
        name={name}
        setName={setName}
        userUseCases={userUseCases}
        setUserUseCases={setUserUseCases}
      />
    </>
  )
}

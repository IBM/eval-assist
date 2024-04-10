import React, { useState } from 'react'

import { useRouter } from 'next/router'

import { NewTab } from '@carbon/icons-react'
import { Column, IconButton, Loading } from '@carbon/react'
import { Button, ClickableTile, FlexGrid, Modal, Row, TextInput } from '@carbon/react'
import { Close } from '@carbon/react/icons'
import classes from '@styles/Home.module.scss'

import { useFormattedDate } from '@customHooks/useFormattedDate'
import { Evaluation } from '@prisma/client'
import { deleteCustom, get, post } from '@utils/fetchUtils'

import { ConfirmationDialog } from './ConfirmationDialog'

interface EvaluationTileProps {
  evaluation: Evaluation
  i: number
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  onDeleteConfirmationClick: (e: MouseEvent, evaluation: Evaluation) => void
}

const ExperientTile = ({ evaluation, i, setIsLoading, onDeleteConfirmationClick }: EvaluationTileProps) => {
  const router = useRouter()

  const onClick = async (evaluation: Evaluation) => {
    router.push('/evaluation/' + evaluation.id)
  }

  const createdAt = useFormattedDate(new Date(evaluation.created_at))

  return (
    <ClickableTile
      key={i}
      onClick={() => onClick(evaluation)}
      style={{
        display: 'flex',
        gap: '10px',
        alignContent: 'center',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ color: 'grey' }}>Evaluation</div>
        <IconButton
          kind={'ghost'}
          size="sm"
          label="Delete"
          onClick={(e) => onDeleteConfirmationClick(e as unknown as MouseEvent, evaluation)}
        >
          <Close size={16} />
        </IconButton>
      </div>
      <div style={{ fontSize: 'larger' }}>
        <strong>{evaluation.name}</strong>
      </div>
      <div style={{ color: 'grey' }}>{createdAt}</div>
    </ClickableTile>
  )
}

interface Props {
  fetchedEvaluations: Evaluation[]
}

export const LandingPage = ({ fetchedEvaluations }: Props) => {
  const router = useRouter()
  const [evaluationName, setEvaluationName] = useState('')
  const [creatingEvaluation, setCreatingEvaluation] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [evaluations, setEvaluations] = useState(fetchedEvaluations)
  const [deleteConfirmationDialogOpen, setDeleteConfirmationDialogOpen] = useState(false)
  const [toDeleteEvaluation, setToDeleteEvaluation] = useState<Evaluation | null>(null)

  const createEvaluation = async () => {
    try {
      setCreatingEvaluation(false)
      setIsLoading(true)
      const evaluation: Evaluation = await (
        await post('evaluation', {
          name: evaluationName,
        })
      ).json()
      setIsLoading(false)
      router.push('/evaluation/' + evaluation.id)
    } catch (error) {
      console.log(error)
    } finally {
      setEvaluationName('')
    }
  }

  const deleteEvaluation = (evaluationId: number) => {
    deleteCustom(`evaluation/${evaluationId}`)
      .then((res) => res.json())
      .then((deletedEvaluation: Evaluation) => {
        setEvaluations(evaluations.filter((e) => e.id !== deletedEvaluation.id))
        setToDeleteEvaluation(null)
      })
  }

  const onDeleteConfirmationClick = (e: MouseEvent, evaluation: Evaluation) => {
    e.stopPropagation()
    setDeleteConfirmationDialogOpen(true)
    setToDeleteEvaluation(evaluation)
  }

  return (
    <div style={{ width: '100%' }}>
      {creatingEvaluation && (
        <Modal
          selectorPrimaryFocus={'.focusme'}
          open={creatingEvaluation}
          onRequestClose={() => {
            setCreatingEvaluation(false)
          }}
          modalHeading="Create an evaluation"
          primaryButtonText="OK"
          onRequestSubmit={() => {
            createEvaluation()
          }}
          shouldSubmitOnEnter
        >
          <TextInput
            className="focusme"
            autoFocus={true}
            labelText="Evaluation name"
            id="text-area-1"
            value={evaluationName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setEvaluationName(e.target.value)
            }}
          />
        </Modal>
      )}

      <FlexGrid condensed fullWidth>
        <Row style={{ marginBottom: '20px' }}>
          <Column>
            <Button
              className={classes['new-prompt']}
              renderIcon={NewTab}
              onClick={() => {
                setCreatingEvaluation(true)
              }}
            >
              New evaluation
            </Button>
          </Column>
        </Row>
        <Row narrow>
          {isLoading && <Loading withOverlay />}
          {evaluations.map((evaluation, i) => (
            <Column key={i} lg={2} sm={2} style={{ marginBottom: '16px' }}>
              <ExperientTile
                evaluation={evaluation}
                i={i}
                setIsLoading={setIsLoading}
                onDeleteConfirmationClick={onDeleteConfirmationClick}
              />
            </Column>
          ))}
        </Row>
      </FlexGrid>
      <ConfirmationDialog
        open={deleteConfirmationDialogOpen}
        setOpen={setDeleteConfirmationDialogOpen}
        evaluation={toDeleteEvaluation}
        onDeleteEvaluation={deleteEvaluation}
      />
    </div>
  )
}

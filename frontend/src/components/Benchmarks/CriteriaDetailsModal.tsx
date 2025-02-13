import cx from 'classnames'
import { isInstanceOfCriteriaWithOptions } from 'src/utils'

import { Dispatch, SetStateAction, useCallback } from 'react'

import { Button, Layer, ListItem, Modal, UnorderedList } from '@carbon/react'
import { Launch } from '@carbon/react/icons'

import { useTestCaseLibrary } from '@customHooks/useTestCaseLibrary'
import { Criteria, CriteriaWithOptions, EvaluationType } from '@types'

import classes from './CriteriaDetailsModal.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  criteria: CriteriaWithOptions | Criteria
  type: EvaluationType
}

export const CriteriaDetailsModal = ({ criteria, type, open, setOpen }: Props) => {
  const { allLibraryUseCases } = useTestCaseLibrary()

  const onClose = () => {
    setOpen(false)
  }

  const getLibraryTestCaseNameFromCriteriaName = useCallback(
    (criteriaName: string) => allLibraryUseCases.find((l) => l.criteria.name === criteriaName)?.name ?? null,
    [allLibraryUseCases],
  )

  const getURLFromCriteriaName = useCallback(
    (criteriaName: string) => {
      const libraryTestCaseName = getLibraryTestCaseNameFromCriteriaName(criteriaName)
      if (libraryTestCaseName !== null) {
        return `/?libraryTestCase=${getLibraryTestCaseNameFromCriteriaName(criteriaName)}&type=${type}`
      } else {
        return `/?&type=${type}&criteriaName=${criteriaName}`
      }
    },
    [getLibraryTestCaseNameFromCriteriaName, type],
  )

  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      passiveModal
      size="sm"
      modalHeading={`Criteria details: ${criteria.name}`}
      className={classes.root}
    >
      <Layer style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <p>
          <strong>{'Name: '}</strong> {criteria.name}
        </p>

        <p>
          <strong>{'Criteria: '}</strong>
          {criteria.description}
        </p>

        {isInstanceOfCriteriaWithOptions(criteria) && (
          <div>
            <p style={{ marginBottom: '0.25rem' }}>
              <strong>Options:</strong>
            </p>
            <UnorderedList className={classes.list}>
              {criteria.options.map((option, i) => (
                <ListItem key={i}>
                  <p>
                    <span style={{ fontWeight: 500 }}>{option.name + ': '}</span>
                    {option.description}
                  </p>
                </ListItem>
              ))}
            </UnorderedList>
          </div>
        )}

        <Button
          renderIcon={Launch}
          kind="tertiary"
          href={getURLFromCriteriaName(criteria.name)}
          rel="noopener noreferrer"
          className={classes.button}
        >
          {'Try it'}
        </Button>
      </Layer>
    </Modal>
  )
}

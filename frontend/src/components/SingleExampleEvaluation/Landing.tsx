import cx from 'classnames'

import { Dispatch, SetStateAction } from 'react'

import { Button, useTheme } from '@carbon/react'
import { Add, ArrowDownRight, ArrowRight, Launch, View } from '@carbon/react/icons'

import { PAIRWISE_NAME, RUBRIC_NAME } from '@utils/constants'
import { getEmptyUseCase } from '@utils/utils'

import { Card } from './Card/Card'
import classes from './Landing.module.scss'
import { PipelineType, UseCase } from './types'

interface Props {
  setNewUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  setCurrentUseCase: (useCase: UseCase) => void
  setSidebarTabSelected: Dispatch<SetStateAction<'user_use_cases' | 'library_use_cases' | null>>
}

export const Landing = ({ setNewUseCaseModalOpen, setCurrentUseCase, setSidebarTabSelected }: Props) => {
  const { theme } = useTheme()

  const createEmptyRubric = () => {
    setCurrentUseCase({
      ...getEmptyUseCase(PipelineType.RUBRIC),
      pipeline: PipelineType.RUBRIC,
    })
  }

  const createEmptyPairwise = () => {
    setCurrentUseCase({
      ...getEmptyUseCase(PipelineType.PAIRWISE),
      pipeline: PipelineType.PAIRWISE,
    })
  }

  const openTestCasesLibrary = () => {
    setSidebarTabSelected('library_use_cases')
  }

  return (
    <div className={classes.root}>
      <h2 className={classes.heading}>Welcome</h2>
      <p className={classes.description}>{'Here are some key features we offer'}</p>
      <div className={classes.cards}>
        <Card
          title={RUBRIC_NAME}
          description={'Select an answer based on the criteria for the question'}
          imageSrc="rubric_helper"
          onClick={createEmptyRubric}
          actionButton={
            <Button renderIcon={ArrowRight} kind="ghost" onClick={createEmptyRubric}>
              {'Try it'}
            </Button>
          }
          className={cx({ [classes['card-white-mode']]: theme === 'white' })}
          badge={{ text: 'Sandbox', color: 'blue' }}
        />
        <Card
          title={PAIRWISE_NAME}
          description={'Compare to choose the which response is better'}
          imageSrc="pairwise_helper"
          actionButton={
            <Button renderIcon={ArrowRight} kind="ghost" onClick={createEmptyPairwise}>
              {'Try it'}
            </Button>
          }
          className={cx({ [classes['card-white-mode']]: theme === 'white' })}
          badge={{ text: 'Sandbox', color: 'blue' }}
        />
        <Card
          title={'Example Catalog'}
          description={'A catalogu of customizable criteria along with sample test data'}
          imageSrc="test_case_library"
          actionButton={
            <Button renderIcon={View} kind="ghost" onClick={openTestCasesLibrary}>
              {'View it'}
            </Button>
          }
          className={cx({ [classes['card-white-mode']]: theme === 'white' })}
          badge={{ text: 'Catalogue', color: 'purple' }}
        />
        <Card
          title={'LLM-as-a-judge Toolkit'}
          description={'Apply criteria from sandbox with larger dataset'}
          imageSrc="python_library"
          actionButton={
            <Button
              renderIcon={Launch}
              kind="ghost"
              href="https://github.ibm.com/AIExperience/llm-as-a-judge"
              target="_blank"
              rel="noopener noreferrer"
            >
              {'View it'}
            </Button>
          }
          className={cx({ [classes['card-white-mode']]: theme === 'white' })}
          badge={{ text: 'Python Library', color: 'green' }}
        />
      </div>
      <Button
        renderIcon={Add}
        onClick={() => {
          setNewUseCaseModalOpen(true)
        }}
      >
        {'Create New Test Case'}
      </Button>
    </div>
  )
}

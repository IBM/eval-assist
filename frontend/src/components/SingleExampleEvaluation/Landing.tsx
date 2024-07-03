import cx from 'classnames'

import { Dispatch, SetStateAction } from 'react'

import { Button } from '@carbon/react'
import { Add, ArrowRight, Launch, View } from '@carbon/react/icons'

import { useThemeContext } from '@components/ThemeProvider/ThemeProvider'
import { useAuthentication } from '@customHooks/useAuthentication'
import { PAIRWISE_NAME, RUBRIC_NAME } from '@utils/constants'
import { getEmptyUseCase } from '@utils/utils'

import { PipelineType, UseCase } from '../../utils/types'
import { Card } from './Card/Card'
import classes from './Landing.module.scss'
import { useAppSidebarContext } from './Providers/AppSidebarProvider'

interface Props {
  setNewUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  updateURLFromUseCase: (useCase: UseCase) => void
}

export const Landing = ({ setNewUseCaseModalOpen, updateURLFromUseCase }: Props) => {
  const { isDarkMode } = useThemeContext()
  const { sidebarTabSelected, setSidebarTabSelected } = useAppSidebarContext()

  const createEmptyRubric = () => {
    updateURLFromUseCase(getEmptyUseCase(PipelineType.RUBRIC))
  }

  const createEmptyPairwise = () => {
    updateURLFromUseCase(getEmptyUseCase(PipelineType.PAIRWISE))
  }

  const openTestCasesLibrary = () => {
    setSidebarTabSelected('library_use_cases')
  }

  const { user } = useAuthentication()

  return (
    <div className={classes.root}>
      <h2 className={classes.heading}>{`Welcome${user && user.name ? ', ' + user.name : ''}`}</h2>
      <p className={classes.description}>{'Here are some key features we offer'}</p>
      <div className={cx(classes.cards, { [classes['sidebar-expanded']]: sidebarTabSelected !== null })}>
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
          className={cx({ [classes['card-white-mode']]: !!!isDarkMode() })}
          badge={{ text: 'Sandbox', color: 'blue' }}
          isImagePriority={true}
        />
        <Card
          title={PAIRWISE_NAME}
          description={'Compare to choose the which response is better'}
          imageSrc="pairwise_helper"
          onClick={createEmptyPairwise}
          actionButton={
            <Button renderIcon={ArrowRight} kind="ghost" onClick={createEmptyPairwise}>
              {'Try it'}
            </Button>
          }
          className={cx({ [classes['card-white-mode']]: !!!isDarkMode() })}
          badge={{ text: 'Sandbox', color: 'blue' }}
        />
        <Card
          title={'Example Catalog'}
          description={'A catalog of customizable criteria along with sample test data'}
          imageSrc="test_case_library"
          onClick={openTestCasesLibrary}
          actionButton={
            <Button renderIcon={View} kind="ghost" onClick={openTestCasesLibrary}>
              {'View it'}
            </Button>
          }
          className={cx({ [classes['card-white-mode']]: !!!isDarkMode() })}
          badge={{ text: 'Catalog', color: 'purple' }}
        />
        <Card
          title={'LLM-as-a-judge Toolkit'}
          description={'Apply criteria from sandbox with larger dataset'}
          imageSrc="python_library"
          onClick={() => {
            const newWindow = window.open(
              'https://github.ibm.com/AIExperience/llm-as-a-judge',
              '_blank',
              'noopener,noreferrer',
            )
            if (newWindow) newWindow.opener = null
          }}
          actionButton={
            <Button
              renderIcon={Launch}
              kind="ghost"
              href="https://github.ibm.com/AIExperience/llm-as-a-judge"
              target="_blank"
              rel="noopener noreferrer"
            >
              {'Go'}
            </Button>
          }
          className={cx({ [classes['card-white-mode']]: !!!isDarkMode() })}
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

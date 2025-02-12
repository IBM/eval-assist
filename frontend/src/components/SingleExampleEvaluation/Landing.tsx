import cx from 'classnames'
import { DIRECT_NAME, PAIRWISE_NAME } from 'src/constants'
import { getEmptyUseCase } from 'src/utils'

import { Dispatch, SetStateAction } from 'react'

import { Button } from '@carbon/react'
import { Add, ArrowRight, Launch, View } from '@carbon/react/icons'

import { useThemeContext } from '@components/ThemeProvider/ThemeProvider'
import { useAuthentication } from '@customHooks/useAuthentication'

import { EvaluationType, UseCase } from '../../types'
import { Card } from './Card/Card'
import classes from './Landing.module.scss'
import { useAppSidebarContext } from './Providers/AppSidebarProvider'

interface Props {
  setNewUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  updateURLFromUseCase: (useCaseSelected: { useCase: UseCase; subCatalogName: string | null }) => void
}

export const Landing = ({ setNewUseCaseModalOpen, updateURLFromUseCase }: Props) => {
  const { isDarkMode } = useThemeContext()
  const { sidebarTabSelected, setSidebarTabSelected } = useAppSidebarContext()

  const createEmptyRubric = () => {
    updateURLFromUseCase({ useCase: getEmptyUseCase(EvaluationType.DIRECT), subCatalogName: null })
  }

  const createEmptyPairwise = () => {
    updateURLFromUseCase({ useCase: getEmptyUseCase(EvaluationType.PAIRWISE), subCatalogName: null })
  }

  const openTestCasesLibrary = () => {
    setSidebarTabSelected('library_use_cases')
  }

  const openRisksAndHarms = () => {
    setSidebarTabSelected('risks_and_harms')
  }

  const { user } = useAuthentication()

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <h2 className={classes.heading}>{`Welcome${user && user.name ? ', ' + user.name : ''}`}</h2>
        <Button
          renderIcon={Add}
          onClick={() => {
            setNewUseCaseModalOpen(true)
          }}
        >
          {'Create New Test Case'}
        </Button>
      </div>
      <p className={classes.description}>{'New features'}</p>
      <div
        className={cx(classes.cards, {
          [classes['sidebar-expanded']]: sidebarTabSelected !== null,
        })}
      >
        <Card
          title={'Direct Assessment of Harms & Risks'}
          description={'Try Granite Guardian LLM judges'}
          imageSrc="python_library"
          onClick={openRisksAndHarms}
          actionButton={
            <Button renderIcon={View} kind="ghost" onClick={openRisksAndHarms}>
              {'View it'}
            </Button>
          }
          className={cx({ [classes['card-white-mode']]: !!!isDarkMode() })}
          badge={{ text: 'Catalog', color: 'purple' }}
        />
      </div>
      <div className={cx(classes.bottomDivider)}></div>
      <p className={cx(classes.description, classes.sectionSeparation)}>{'Here are some key features we offer'}</p>
      <div className={cx(classes.cards, { [classes['sidebar-expanded']]: sidebarTabSelected !== null })}>
        <Card
          title={DIRECT_NAME}
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
    </div>
  )
}

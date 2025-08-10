import cx from 'classnames'
import { DIRECT_NAME, PAIRWISE_NAME } from 'src/constants'
import { getEmptyTestCase } from 'src/utils'

import { Dispatch, SetStateAction } from 'react'

import { Button } from '@carbon/react'
import { Add, ArrowRight, Launch, Upload, View } from '@carbon/react/icons'

import { useThemeContext } from '@components/ThemeProvider/ThemeProvider'
import { useAuthentication } from '@customHooks/useAuthentication'
import { useAppSidebarContext } from '@providers/AppSidebarProvider'
import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useModalsContext } from '@providers/ModalsProvider'

import { EvaluationType, TestCase } from '../../types'
import { Card } from './Card/Card'
import classes from './Landing.module.scss'

interface Props {}

export const Landing = ({}: Props) => {
  const { isDarkMode } = useThemeContext()
  const { sidebarTabSelected, setSidebarTabSelected } = useAppSidebarContext()
  const { setNewTestCaseModalOpen, setImportTestCaseModalOpen: setUploadTestCaseModalOpen } = useModalsContext()
  const { updateURLFromTestCase } = useCurrentTestCase()

  const createEmptyDirectTestCase = () => {
    updateURLFromTestCase({ testCase: getEmptyTestCase(EvaluationType.DIRECT), subCatalogName: null })
  }

  const createEmptyPairwiseTestCase = () => {
    updateURLFromTestCase({ testCase: getEmptyTestCase(EvaluationType.PAIRWISE), subCatalogName: null })
  }

  const openTestCasesLibrary = () => {
    setSidebarTabSelected('library_test_cases')
  }

  const openRisksAndHarms = () => {
    setSidebarTabSelected('risks_and_harms')
  }

  const { user } = useAuthentication()

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <h2 className={classes.heading}>{`Welcome${user && user.name ? ', ' + user.name : ''}`}</h2>
        <div>
          <Button
            style={{ marginRight: '0.25rem' }}
            kind="tertiary"
            onClick={() => {
              setNewTestCaseModalOpen(true)
            }}
            renderIcon={Add}
          >
            {'New Test Case'}
          </Button>
          <Button
            kind="tertiary"
            onClick={() => {
              setUploadTestCaseModalOpen(true)
            }}
            renderIcon={Upload}
          >
            {'Import Test Case'}
          </Button>
        </div>
      </div>
      {/* <p className={classes.description}>{'New features'}</p>
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
      <div className={cx(classes.bottomDivider)}></div> */}
      <p className={cx(classes.description, classes.sectionSeparation)}>{'Here are some key features we offer'}</p>
      <div className={cx(classes.cards, { [classes['sidebar-expanded']]: sidebarTabSelected !== null })}>
        <Card
          title={DIRECT_NAME}
          description={'Select an answer based on the criteria for the question'}
          imageSrc="rubric_helper"
          onClick={createEmptyDirectTestCase}
          actionButton={
            <Button renderIcon={ArrowRight} kind="ghost" onClick={createEmptyDirectTestCase}>
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
          onClick={createEmptyPairwiseTestCase}
          actionButton={
            <Button renderIcon={ArrowRight} kind="ghost" onClick={createEmptyPairwiseTestCase}>
              {'Try it'}
            </Button>
          }
          className={cx({ [classes['card-white-mode']]: !!!isDarkMode() })}
          badge={{ text: 'Sandbox', color: 'blue' }}
        />
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
      </div>
    </div>
  )
}

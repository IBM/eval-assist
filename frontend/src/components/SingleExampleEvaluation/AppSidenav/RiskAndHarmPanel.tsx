import cx from 'classnames'
import { capitalizeFirstWord, toTitleCase } from 'src/utils'

import { useMemo, useState } from 'react'

import { IconButton } from '@carbon/react'
// carbon doesnt yet have types of TreeView
// @ts-ignore
import { TreeNode, TreeView } from '@carbon/react'
import { ChevronLeft, DotMark, List } from '@carbon/react/icons'

import { useTestCaseLibrary } from '@customHooks/useTestCaseLibrary'
import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useURLParamsContext } from '@providers/URLParamsProvider'

import { TestCase } from '../../../types'
import { LinkButton } from './LinkButton'
import classes from './ThreeLevelsPanel.module.scss'
import sharedClasses from './shared.module.scss'

interface Props {
  onUseCaseClick: (useCase: TestCase, subCatalogName?: string) => void
  onClose: () => void
}

export const RiskAndHarmPanel = ({ onClose, onUseCaseClick }: Props) => {
  const { harmsAndRisksLibraryTestCases } = useTestCaseLibrary()

  const [expanded, setExpanded] = useState<{ rubric: boolean; pairwise: boolean } & { [key: string]: boolean }>({
    rubric: true,
    pairwise: true,
    ...Object.keys(harmsAndRisksLibraryTestCases).reduce((acc, item, index) => ({ ...acc, [item]: true }), {}),
  })

  const { subCatalogName } = useURLParamsContext()
  const { preloadedTestCase } = useCurrentTestCase()

  const selectedNode = useMemo(() => {
    return preloadedTestCase !== null && preloadedTestCase.id === null
      ? [`${preloadedTestCase.name}_${subCatalogName}`]
      : []
  }, [preloadedTestCase, subCatalogName])

  const handleToggle = (key: string) =>
    setExpanded({
      ...expanded,
      [key]: !expanded[key],
    })

  const onClick = (e: any, useCase: TestCase, subCatalogName: string) => {
    e.stopPropagation()
    e.preventDefault()
    onUseCaseClick(useCase, subCatalogName)
  }

  return (
    <section className={cx(classes.root)}>
      <header className={classes.header}>
        <h2 className={classes.heading}>Example Catalog - Harms & Risks</h2>
        <IconButton label="Close" align="right" kind="ghost" onClick={onClose}>
          <ChevronLeft />
        </IconButton>
      </header>
      <div className={classes.content}>
        <div className={classes.treeWrapper}>
          <TreeView label="" selected={selectedNode}>
            {Object.entries(harmsAndRisksLibraryTestCases).map(([subCatalogName, useCases]) => (
              <TreeNode
                label={capitalizeFirstWord(subCatalogName)}
                onSelect={() => handleToggle(subCatalogName)}
                onToggle={() => handleToggle(subCatalogName)}
                isExpanded={expanded[subCatalogName]}
                key={subCatalogName}
                className={classes.treeCategory}
              >
                {useCases.map((useCase, i) => (
                  <TreeNode
                    className={cx(sharedClasses.hovered)}
                    label={
                      <div className={classes['treeNodeContent']}>
                        <span className={classes['treeNodeLabel']}>{toTitleCase(useCase.name)}</span>
                        <LinkButton useCase={useCase} subCatalogName={subCatalogName} />
                      </div>
                    }
                    key={`${useCase.name}_${subCatalogName}`}
                    id={`${useCase.name}_${subCatalogName}`}
                    renderIcon={DotMark}
                    onClick={(e: any) => onClick(e, useCase, subCatalogName)}
                  />
                ))}
              </TreeNode>
            ))}
            {/* </TreeNode> */}
          </TreeView>
        </div>
      </div>
    </section>
  )
}

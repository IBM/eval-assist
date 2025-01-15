import cx from 'classnames'

import { useMemo, useState } from 'react'

import { IconButton } from '@carbon/react'
// carbon doesnt yet have types of TreeView
// @ts-ignore
import { TreeNode, TreeView } from '@carbon/react'
import { ChevronLeft, List } from '@carbon/react/icons'

import { useTestCaseLibrary } from '@customHooks/useTestCaseLibrary'
import { toTitleCase } from '@utils/utils'

import { UseCase } from '../../../types'
import { useURLInfoContext } from '../Providers/URLInfoProvider'
import { LinkButton } from './LinkButton'
import classes from './ThreeLevelsPanel.module.scss'

interface Props {
  onUseCaseClick: (useCase: UseCase, subCatalogName?: string) => void
  onClose: () => void
}

export const RiskAndHarmPanel = ({ onClose, onUseCaseClick }: Props) => {
  const { harmsAndRisksLibraryTestCases } = useTestCaseLibrary()

  const [expanded, setExpanded] = useState<{ rubric: boolean; pairwise: boolean } & { [key: string]: boolean }>({
    rubric: true,
    pairwise: true,
    ...Object.keys(harmsAndRisksLibraryTestCases).reduce((acc, item, index) => ({ ...acc, [item]: true }), {}),
  })

  const { preloadedUseCase, subCatalogName } = useURLInfoContext()

  const selectedNode = useMemo(() => {
    return preloadedUseCase !== null && preloadedUseCase.id === null
      ? [`${preloadedUseCase.name}_${subCatalogName}`]
      : []
  }, [preloadedUseCase, subCatalogName])

  const handleToggle = (key: string) =>
    setExpanded({
      ...expanded,
      [key]: !expanded[key],
    })

  const onClick = (e: any, useCase: UseCase, subCatalogName: string) => {
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
            {/* <TreeNode
              key={'rubric'}
              label={RUBRIC_NAME}
              onSelect={() => handleToggle('rubric')}
              onToggle={() => handleToggle('rubric')}
              isExpanded={expanded.rubric}
            > */}
            {Object.entries(harmsAndRisksLibraryTestCases).map(([subCatalogName, useCases]) => (
              <TreeNode
                label={subCatalogName}
                onSelect={() => handleToggle(subCatalogName)}
                onToggle={() => handleToggle(subCatalogName)}
                isExpanded={expanded[subCatalogName]}
                key={subCatalogName}
                className={classes.treeCategory}
              >
                {useCases.map((useCase, i) => (
                  <TreeNode
                    label={
                      <div className={classes['treeNodeContent']}>
                        <span className={classes['treeNodeLabel']}>{toTitleCase(useCase.name)}</span>
                        <LinkButton useCase={useCase} subCatalogName={subCatalogName} />
                      </div>
                    }
                    key={`${useCase.name}_${subCatalogName}`}
                    id={`${useCase.name}_${subCatalogName}`}
                    renderIcon={List}
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

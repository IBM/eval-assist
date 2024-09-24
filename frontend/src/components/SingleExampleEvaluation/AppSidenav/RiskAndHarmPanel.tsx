import cx from 'classnames'
import { PAIRWISE_NAME, RUBRIC_NAME } from 'src/constants'

import { useMemo, useState } from 'react'

import { IconButton } from '@carbon/react'
// carbon doesnt yet have types of TreeView
// @ts-ignore
import { TreeNode, TreeView } from '@carbon/react'
import { ChevronLeft, Compare, List } from '@carbon/react/icons'

import { useLibraryTestCases } from '@customHooks/useLibraryTestCases'

import { UseCase } from '../../../types'
import { useURLInfoContext } from '../Providers/URLInfoProvider'
import { LinkButton } from './LinkButton'
import classes from './ThreeLevelsPanel.module.scss'

interface Props {
  onUseCaseClick: (useCase: UseCase) => void
  onClose: () => void
}

export const RiskAndHarmPanel = ({ onClose, onUseCaseClick }: Props) => {
  const { risksAndHarmsLibraryTestCases } = useLibraryTestCases()

  const [expanded, setExpanded] = useState<{ rubric: boolean; pairwise: boolean } & { [key: string]: boolean }>({
    rubric: true,
    pairwise: true,
    ...Object.keys(risksAndHarmsLibraryTestCases).reduce((acc, item, index) => ({ ...acc, [item]: true }), {}),
  })

  const { preloadedUseCase } = useURLInfoContext()

  const selectedNode = useMemo(() => {
    return preloadedUseCase !== null && preloadedUseCase.id === null
      ? [`${preloadedUseCase.name}_${preloadedUseCase.type}`]
      : []
  }, [preloadedUseCase])

  const handleToggle = (key: string) =>
    setExpanded({
      ...expanded,
      [key]: !expanded[key],
    })

  const onClick = (e: any, useCase: UseCase) => {
    e.stopPropagation()
    e.preventDefault()
    onUseCaseClick(useCase)
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
            {Object.entries(risksAndHarmsLibraryTestCases).map(([categoryName, useCases]) => (
              <TreeNode
                label={categoryName}
                onSelect={() => handleToggle(categoryName)}
                onToggle={() => handleToggle(categoryName)}
                isExpanded={expanded[categoryName]}
                key={categoryName}
                className={classes.treeCategory}
              >
                {useCases.map((useCase, i) => (
                  <TreeNode
                    label={
                      <div className={classes['treeNodeContent']}>
                        <span className={classes['treeNodeLabel']}>{useCase.name}</span>
                        <LinkButton useCase={useCase} />
                      </div>
                    }
                    key={`${useCase.name}_rubric`}
                    id={`${useCase.name}_rubric`}
                    renderIcon={List}
                    onClick={(e: any) => onClick(e, useCase)}
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

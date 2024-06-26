import cx from 'classnames'

import { useMemo, useState } from 'react'

// carbon doesnt yet have types of TreeView
// @ts-ignore
import { TreeNode, TreeView } from '@carbon/react'
import { List } from '@carbon/react/icons'

import { PAIRWISE_NAME, RUBRIC_NAME } from '@utils/constants'
import { Benchmark, PipelineType } from '@utils/types'

import { useURLInfoContext } from '../Providers/URLInfoProvider'
import classes from './index.module.scss'

interface Props {
  benchmarkLibrary: Benchmark[]
}
export const BenchmarkSidenav = ({ benchmarkLibrary }: Props) => {
  const { benchmark, updateURLFromBenchmark } = useURLInfoContext()
  const rubricBenchmarks = useMemo(() => benchmarkLibrary.filter((b) => b.type === PipelineType.RUBRIC), [])
  const pairwiseBenchmarks = useMemo(() => benchmarkLibrary.filter((b) => b.type === PipelineType.PAIRWISE), [])
  const [expanded, setExpanded] = useState<{ rubric: boolean; pairwise: boolean }>({
    rubric: true,
    pairwise: true,
  })

  const handleToggle = (key: 'rubric' | 'pairwise') =>
    setExpanded({
      ...expanded,
      [key]: !expanded[key],
    })

  const selectedBenchmark = useMemo(() => {
    return benchmark !== null ? [`${benchmark.name}_${benchmark.type}`] : []
  }, [benchmark])

  const onClick = (e: any, benchmark: Benchmark) => {
    e.stopPropagation()
    e.preventDefault()
    updateURLFromBenchmark(benchmark)
  }

  return (
    <aside className={cx(classes.sidebar)}>
      <div role="tabpanel" className={classes.panel} tabIndex={-1}>
        <section className={cx(classes.root)}>
          <header className={classes.header}>
            <h2 className={classes.heading}>Benchmark Catalog</h2>
          </header>
          <div className={classes.content}>
            <div className={classes.prompts}>
              <section className={classes.section}>
                <div className={classes['tree-wrapper']}>
                  <TreeView className={classes['tree-root']} label="" selected={selectedBenchmark} id={'tree-view'}>
                    <TreeNode
                      id={'rubric'}
                      label={RUBRIC_NAME}
                      onSelect={() => handleToggle('rubric')}
                      onToggle={() => handleToggle('rubric')}
                      isExpanded={expanded['rubric']}
                    >
                      {rubricBenchmarks.map((rubricBenchmark, i) => (
                        <TreeNode
                          label={
                            <div className={classes['tree-node-content']}>
                              <span className={classes['tree-node-label']}>{rubricBenchmark.name}</span>
                            </div>
                          }
                          key={`${rubricBenchmark.name}_rubric`}
                          id={`${rubricBenchmark.name}_rubric`}
                          renderIcon={List}
                          onClick={(e: any) => onClick(e, rubricBenchmark)}
                          selected={selectedBenchmark}
                        />
                      ))}
                    </TreeNode>
                    <TreeNode
                      id={'pairwise'}
                      label={PAIRWISE_NAME}
                      onSelect={() => handleToggle('pairwise')}
                      onToggle={() => handleToggle('pairwise')}
                      isExpanded={expanded['pairwise']}
                    >
                      {pairwiseBenchmarks.map((pairwiseBenchmark, i) => (
                        <TreeNode
                          label={
                            <div className={classes['tree-node-content']}>
                              <span className={classes['tree-node-label']}>{pairwiseBenchmark.name}</span>
                            </div>
                          }
                          key={`${pairwiseBenchmark.name}_pairwise`}
                          id={`${pairwiseBenchmark.name}_pairwise`}
                          renderIcon={List}
                          onClick={(e: any) => onClick(e, pairwiseBenchmark)}
                          selected={selectedBenchmark}
                        />
                      ))}
                    </TreeNode>
                  </TreeView>
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </aside>
  )
}

import cx from 'classnames'

import { useMemo, useState } from 'react'

import { PAIRWISE_NAME, RUBRIC_NAME } from '@utils/constants'
import { BadgeColor, PipelineType, badgeColorsArray } from '@utils/types'

import { BenchmarkCard } from './BenchmarkCard'
import { Filter } from './Filter'
import landingClasses from './Landing.module.scss'
import { useBenchmarksContext } from './Providers/BenchmarksProvider'
import { BenchmarkSidenav } from './Sidenav'
import classes from './index.module.scss'

export const Landing = () => {
  const { benchmarks } = useBenchmarksContext()
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const filteredBenchmarks = useMemo(() => {
    if (selectedItems.length === 0) {
      return benchmarks
    } else {
      return benchmarks.filter((b) => {
        return selectedItems.every((tag) => {
          if (tag === RUBRIC_NAME && b.type === PipelineType.RUBRIC) {
            return true
          }
          if (tag === PAIRWISE_NAME && b.type === PipelineType.PAIRWISE) {
            return true
          }
          return b.tags.includes(tag)
        })
      })
    }
  }, [benchmarks, selectedItems])

  const allTags = useMemo(() => {
    const tags: string[] = []
    benchmarks.forEach((benchmark) => {
      benchmark.tags.forEach((tag) => {
        if (!tags.includes(tag)) {
          tags.push(tag)
        }
      })
    })
    tags.sort((a, b) => b.localeCompare(a))
    return tags
  }, [benchmarks])

  const tagToColor: {
    [key: string]: BadgeColor
  } = useMemo(() => {
    const dict: { [key: string]: BadgeColor } = {}
    dict[RUBRIC_NAME] = 'blue'
    dict[PAIRWISE_NAME] = 'blue'
    allTags.forEach((tag, i) => {
      const color = badgeColorsArray[i]
      dict[tag] = color
    })
    return dict
  }, [allTags])

  return (
    <>
      <BenchmarkSidenav />
      <div className={cx(classes.root, classes.leftPadding)}>
        <h3 className={cx(classes.title, classes.bottomDivider)}>Benchmarks</h3>
        <Filter
          items={[RUBRIC_NAME, PAIRWISE_NAME, ...allTags]}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          tagToColor={tagToColor}
        />
        {/* <p style={{ fontStyle: 'italic' }}>Click on a benchmark in the sidebar panel to see its content.</p> */}
        {filteredBenchmarks.length > 0 ? (
          <div className={cx(landingClasses.cardsGrid)}>
            {filteredBenchmarks.map((benchmark, i) => (
              <BenchmarkCard key={i} benchmark={benchmark} tagToColor={tagToColor} />
            ))}
          </div>
        ) : (
          <p className={landingClasses.emptyFilterResult}>{'No benchmarks match your filter criteria.'}</p>
        )}
      </div>
    </>
  )
}

import cx from 'classnames'

import Link from 'next/link'

import { ClickableTile, ListItem, Tile, UnorderedList } from '@carbon/react'

import { useThemeContext } from '@components/ThemeProvider/ThemeProvider'
import { PAIRWISE_NAME, RUBRIC_NAME } from '@utils/constants'
import { BadgeColor, Benchmark } from '@utils/types'
import { returnByPipelineType } from '@utils/utils'

import classes from './BenchmarkCard.module.scss'
import { CriteriaBenchmarkCard } from './CriteriaBenchmarkCard'
import { useURLInfoContext } from './Providers/URLInfoProvider'
import { TagBadge } from './TagBadge'

interface Props {
  benchmark: Benchmark
  tagToColor: {
    [key: string]: BadgeColor
  }
  selectedCriteriaItems: string[]
}

export const BenchmarkCard = ({ benchmark, tagToColor, selectedCriteriaItems }: Props) => {
  const { isDarkMode } = useThemeContext()

  const { updateURLFromBenchmark, getURLFromBenchmark } = useURLInfoContext()

  return (
    <ClickableTile
      href={getURLFromBenchmark(benchmark)}
      className={cx(classes.root, { [classes['card-white-mode']]: !!!isDarkMode() })}
    >
      <div className={classes['title-row']}>
        <h5 className={classes.title}>{benchmark.name}</h5>
      </div>
      <UnorderedList className={classes.list}>
        {benchmark.criteriaBenchmarks
          // .filter(
          //   (criteriaBenchmark) =>
          //     selectedCriteriaItems.length === 0 || selectedCriteriaItems.includes(criteriaBenchmark.name),
          // )
          .map((criteriaBenchmark, i) => (
            <ListItem key={i}>
              <Link href={getURLFromBenchmark(benchmark, criteriaBenchmark)} className={classes.criteriaNameLink}>
                {criteriaBenchmark.name}
              </Link>
            </ListItem>
          ))}
      </UnorderedList>
      <div className={classes.tagList}>
        <TagBadge
          name={returnByPipelineType(benchmark.type, RUBRIC_NAME, PAIRWISE_NAME)}
          className={classes.badge}
          size="md"
          color={tagToColor[returnByPipelineType(benchmark.type, RUBRIC_NAME, PAIRWISE_NAME)]}
        />
        {benchmark.tags.map((tag, i) => (
          <TagBadge className={classes.badge} key={i} name={tag} color={tagToColor[tag]} size="md" />
        ))}
      </div>
    </ClickableTile>
  )
}

import cx from 'classnames'

import { ListItem, Tile, UnorderedList } from '@carbon/react'

import { useThemeContext } from '@components/ThemeProvider/ThemeProvider'
import { UseCaseTypeBadge } from '@components/UseCaseTypeBadge/UseCaseTypeBadge'
import { PAIRWISE_NAME, RUBRIC_NAME } from '@utils/constants'
import { BadgeColor, Benchmark } from '@utils/types'
import { returnByPipelineType } from '@utils/utils'

import classes from './BenchmarkCard.module.scss'
import { useURLInfoContext } from './Providers/URLInfoProvider'
import { TagBadge } from './TagBadge'

interface Props {
  benchmark: Benchmark
  tagToColor: {
    [key: string]: BadgeColor
  }
}

export const BenchmarkCard = ({ benchmark, tagToColor }: Props) => {
  const { isDarkMode } = useThemeContext()

  const { updateURLFromBenchmark } = useURLInfoContext()

  const onClick = () => {
    updateURLFromBenchmark(benchmark)
  }

  return (
    <Tile className={cx(classes.root, { [classes['card-white-mode']]: !!!isDarkMode() })} onClick={onClick}>
      <div className={classes['title-row']}>
        <h5 className={classes.title}>{benchmark.name}</h5>
      </div>
      <UnorderedList className={classes.list}>
        {benchmark.criteriaBenchmarks.map((criteriaBenchmark, i) => (
          <ListItem key={i}>
            <p className={classes.criteriaName}>{criteriaBenchmark.name}</p>
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
    </Tile>
  )
}

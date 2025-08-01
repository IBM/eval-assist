import cx from 'classnames'

import { Dispatch, SetStateAction } from 'react'

// @ts-ignore
import { FilterableMultiSelect } from '@carbon/react'

import { BadgeColor } from '@types'
import { splitDotsAndCapitalizeFirstWord } from '@utils'

import classes from './Filter.module.scss'
import { TagBadge } from './TagBadge'

interface Props {
  items: string[]
  selectedItems: string[]
  setSelectedItems: Dispatch<SetStateAction<string[]>>
  tagToColor: {
    [key: string]: BadgeColor
  }
  title: string
  label: string
  className?: string
}

export const Filter = ({ items, selectedItems, setSelectedItems, tagToColor, title, label, className }: Props) => {
  const onSelectionChanged = (e: { selectedItems: string[] }) => {
    setSelectedItems(e.selectedItems || [])
  }

  return (
    <div className={cx(className, classes.root, { [classes.placeholderText]: selectedItems.length === 0 })}>
      <div
        style={{
          width: 300,
          marginRight: '1rem',
        }}
      >
        {/* @ts-ignore */}
        <FilterableMultiSelect
          titleText={title}
          items={items}
          selectedItems={selectedItems}
          onChange={onSelectionChanged}
          selectionFeedback="top-after-reopen"
          id={'filter-multiselect'}
          itemToString={(i: string) => splitDotsAndCapitalizeFirstWord(i)}
        />
      </div>
      <div className={classes.selectedItems}>
        {selectedItems.map((tag, i) => (
          <TagBadge key={i} name={splitDotsAndCapitalizeFirstWord(tag)} color={tagToColor[tag]} size="md" />
        ))}
      </div>
    </div>
  )
}

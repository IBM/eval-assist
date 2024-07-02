import cx from 'classnames'

import { Dispatch, SetStateAction } from 'react'

// @ts-ignore
import { MultiSelect } from '@carbon/react'

import { BadgeColor } from '@utils/types'

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
    <div
      className={cx(className, { [classes.placeholderText]: selectedItems.length === 0 })}
      style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end' }}
    >
      <div
        style={{
          width: 300,
          marginRight: '1rem',
        }}
      >
        <MultiSelect
          titleText={title}
          label={label}
          items={items}
          selectedItems={selectedItems}
          onChange={onSelectionChanged}
          selectionFeedback="top-after-reopen"
          id={'filter-multiselect'}
        />
      </div>
      {selectedItems.map((tag, i) => (
        <TagBadge key={i} name={tag} color={tagToColor[tag]} size="md" />
      ))}
    </div>
  )
}

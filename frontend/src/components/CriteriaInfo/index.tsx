import cx from 'classnames'

import { ListItem, UnorderedList } from '@carbon/react'

import { EditableTag } from '@components/EditableTag'
import { Criteria, CriteriaWithOptions } from '@types'
import { capitalizeFirstWord, isInstanceOfCriteriaWithOptions } from '@utils'

import classes from './index.module.scss'

interface Props {
  criteria: Criteria | CriteriaWithOptions
  includeName?: boolean
  className?: string
}

export const CriteriaInfo = ({ className, criteria, includeName = true }: Props) => {
  return (
    <div className={cx(className, classes.container)}>
      {includeName && (
        <p>
          <strong>{'Name: '}</strong> {capitalizeFirstWord(criteria.name)}
        </p>
      )}

      <p>
        <strong>{'Description: '}</strong>
        {criteria.description}
      </p>

      {isInstanceOfCriteriaWithOptions(criteria) && (
        <div>
          <p>
            <strong>Options:</strong>
          </p>
          <UnorderedList className={classes.optionList}>
            {criteria.options.map((option, i) => (
              <ListItem key={i}>
                <p>
                  <span style={{ fontWeight: 500 }}>{option.name}</span>
                  {option.description ? `: ${option.description}` : ''}
                </p>
              </ListItem>
            ))}
          </UnorderedList>
        </div>
      )}

      {criteria.predictionField && (
        <div className={classes.tagsSection}>
          <p>
            <strong>{'Response variable: '}</strong>
          </p>
          <EditableTag value={criteria.predictionField} color={'blue'} isEditable={false} />
        </div>
      )}
      {criteria.contextFields && (
        <div className={classes.tagsSection}>
          <p>
            <strong>{'Context variables:'}&nbsp;</strong>
          </p>
          {criteria.contextFields.length ? (
            criteria.contextFields.map((contextField, i) => (
              <EditableTag value={contextField} color={'purple'} isEditable={false} key={i} />
            ))
          ) : (
            <p>{'No context fields required for this criteria'}</p>
          )}
        </div>
      )}
    </div>
  )
}

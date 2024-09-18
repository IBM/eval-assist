import cx from 'classnames'

import { CSSProperties } from 'react'

import { Button } from '@carbon/react'
import { Add } from '@carbon/react/icons'

import { FlexTextArea } from '@components/FlexTextArea/FlexTextArea'
import RemovableSection from '@components/RemovableSection/RemovableSection'

import { UseCase } from '../../../types'
import { ContextVariableName } from './ContextVariableName'
import classes from './index.module.scss'

interface Props {
  contextVariables: UseCase['contextVariables']
  setContextVariables: (contextVariables: UseCase['contextVariables']) => void
  style?: CSSProperties
  className?: string
}

export const ContextVariables = ({ style, className, contextVariables, setContextVariables }: Props) => {
  const onAddContextVariable = () => {
    setContextVariables([
      ...contextVariables,
      {
        variable: '',
        value: '',
      },
    ])
  }

  const onRemoveContextVariable = (i: number) => {
    setContextVariables(contextVariables.filter((_, j) => i !== j))
  }

  return (
    <div style={style} className={className}>
      <div className={classes.content}>
        <div className={cx(classes.innerContainer)}>
          <div className={cx(classes.tableRow, classes.headerRow)}>
            <strong className={cx(classes.blockElement, classes.headerBlock, classes.headerTypography)}>
              {'Task context (optional)'}
            </strong>
          </div>
          <div className={cx(classes.tableRow, classes.subHeaderRow)}>
            <p className={cx(classes.blockElement, classes.subHeaderTypography)}>{'Name'}</p>
            <p className={cx(classes.blockElement, classes.subHeaderTypography)}>{'Value'}</p>
          </div>
          {contextVariables.length === 0 && (
            <div className={cx(classes.tableRow, classes.emptyContextRow)}>
              <p className={cx(classes.blockElement, classes.emptyContextBlock, classes.emptyContextTypography)}>
                {'No context variables created yet.'}
              </p>
            </div>
          )}
          {contextVariables?.map((contextVariable, i) => (
            <RemovableSection key={i} onRemove={() => onRemoveContextVariable(i)}>
              {({ setActive, setInactive }) => (
                <div key={i} className={cx(classes.tableRow, classes.contextVariableRow, classes.columns2)}>
                  <ContextVariableName
                    contextVariables={contextVariables}
                    setContextVariables={setContextVariables}
                    contextVariable={contextVariable}
                    setActive={setActive}
                    setInactive={setActive}
                    i={i}
                    className={classes.blockElement}
                  />
                  <FlexTextArea
                    onChange={(e) => {
                      setContextVariables([
                        ...contextVariables.slice(0, i),
                        { variable: contextVariable.variable, value: e.target.value },
                        ...contextVariables.slice(i + 1),
                      ])
                    }}
                    value={contextVariable.value}
                    labelText={''}
                    placeholder="Context variable description"
                    key={`${i}_2`}
                    onFocus={setActive}
                    onBlur={setInactive}
                    className={cx(classes.blockElement)}
                    maxInactiveHeight={30}
                  />
                </div>
              )}
            </RemovableSection>
          ))}
          <div className={cx(classes.tableRow, classes.addResponseRow)}>
            <div className={cx(classes.blockElement, classes.addContextVariableBlock)}>
              <Button kind="ghost" size="sm" renderIcon={Add} onClick={onAddContextVariable}>
                {'Add variable'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

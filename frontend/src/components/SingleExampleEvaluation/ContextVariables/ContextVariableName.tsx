import { CSSProperties, ChangeEvent } from 'react'

import { EditableTag } from '@components/EditableTag'
import { UseCase } from '@types'

import classes from './index.module.scss'

interface Props {
  contextVariables: UseCase['contextVariables']
  setContextVariables: (contextVariables: UseCase['contextVariables']) => void
  contextVariable: { variable: string; value: string }
  setActive: () => void
  setInactive: () => void
  i: number
  style?: CSSProperties
  className?: string
}

export const ContextVariableName = ({
  contextVariables,
  setContextVariables,
  contextVariable,
  setActive,
  setInactive,
  i,
  className,
}: Props) => {
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setContextVariables([
      ...contextVariables.slice(0, i),
      { variable: e.target.value, value: contextVariable.value },
      ...contextVariables.slice(i + 1),
    ])
  }

  return (
    <EditableTag
      value={contextVariable.variable}
      onChange={onChange}
      setActive={setActive}
      setInactive={setInactive}
      color="purple"
      i={i}
      className={classes.blockElement}
    />
  )
}

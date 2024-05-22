import cx from 'classnames'

import { CSSProperties, Dispatch, SetStateAction, useMemo } from 'react'

import { Button, IconButton, TextArea } from '@carbon/react'
import { Add, Close } from '@carbon/react/icons'

import { isInstanceOfPairwiseResult } from '@utils/utils'

import classes from './Responses.module.scss'
import { PairwiseResult, PipelineType, RubricResult } from './types'

interface ResponsesInterface {
  responses: string[]
  setResponses: Dispatch<SetStateAction<string[]>>
  style?: CSSProperties
  className?: string
  type: PipelineType
  results: (RubricResult | PairwiseResult)[] | null
}

export const Responses = ({ responses, setResponses, style, className, type, results }: ResponsesInterface) => {
  const onRemoveResponse = (i: number) => {
    if (responses.length === 1) return
    setResponses(responses.filter((_, j) => i !== j))
  }

  const pairwiseWinnerIndex = useMemo(() => {
    if (results === null || results.length === 0) return null
    if (results.length === 1 && isInstanceOfPairwiseResult(results[0])) {
      return results[0].winnerIndex
    } else return null
  }, [results])

  return (
    <div style={style} className={className}>
      {responses?.map((response, i) => (
        <div key={i} style={{ marginBottom: '0.5rem' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: '0.25rem',
              alignItems: 'center',
            }}
          >
            <div style={{ marginBottom: 0 }}>
              <label className="cds--label">{`Response #${i + 1}`}</label>
              <label className={cx('cds--label', classes['winner-text'])} style={{ marginLeft: '0.25rem' }}>
                {i === pairwiseWinnerIndex ? '(Winner)' : ''}
              </label>
            </div>
            <IconButton
              disabled={responses.length === 1}
              kind={'ghost'}
              size="sm"
              label="Delete"
              align="bottom"
              onClick={() => onRemoveResponse(i)}
            >
              <Close size={14} />
            </IconButton>
          </div>
          <TextArea
            onChange={(e) => setResponses([...responses.slice(0, i), e.target.value, ...responses.slice(i + 1)])}
            rows={4}
            value={response}
            id="text-area-model-output"
            labelText={''}
            placeholder="The response/text to evaluate."
            className={cx({
              [classes['winner-response']]: i === pairwiseWinnerIndex,
            })}
            // className={classes['winner-response']}
          />
        </div>
      ))}
      {type === PipelineType.RUBRIC && (
        <Button
          kind="tertiary"
          size="sm"
          renderIcon={Add}
          style={{ marginTop: '1rem' }}
          onClick={(e) => setResponses([...responses, ''])}
        >
          {'Add response'}
        </Button>
      )}
    </div>
  )
}

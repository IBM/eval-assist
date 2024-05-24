import cx from 'classnames'

import { CSSProperties, Dispatch, SetStateAction, useLayoutEffect, useMemo, useRef } from 'react'

import { Button, IconButton, TextArea } from '@carbon/react'
import { Add, Close } from '@carbon/react/icons'

import { isInstanceOfPairwiseResult } from '@utils/utils'

import classes from './Responses.module.scss'
import { autoUpdateSize, useAutosizeTextArea } from './autosizeTextArea'
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
    console.log(isInstanceOfPairwiseResult(results[0]))
    if (results.length === 1 && isInstanceOfPairwiseResult(results[0])) {
      return results[0].winnerIndex
    } else return null
  }, [results])

  const refs = useRef<HTMLTextAreaElement[]>([])
  refs.current = []

  // Dynamically add refs during rendering
  const addToRefs = (el: HTMLTextAreaElement) => {
    if (el && !refs.current?.includes(el)) {
      refs.current.push(el)
    }
  }

  useAutosizeTextArea(refs.current)

  // Listen for change to window
  useLayoutEffect(() => {
    function updateSize() {
      refs.current.forEach(function (ref: HTMLTextAreaElement) {
        autoUpdateSize(ref)
      })
    }
    window.addEventListener('resize', updateSize)
    updateSize()
    return () => window.removeEventListener('resize', updateSize)
  }, [])

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
            onChange={(e) => {
              setResponses([...responses.slice(0, i), e.target.value, ...responses.slice(i + 1)]),
                autoUpdateSize(e.target)
            }}
            ref={addToRefs}
            rows={1}
            value={response}
            id="text-area-model-output"
            labelText={''}
            placeholder="The response/text to evaluate."
            className={cx({
              [classes['winner-response']]: i === pairwiseWinnerIndex,
            })}
            style={{ resize: 'none' }}
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

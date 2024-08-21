import cx from 'classnames'
import { $createParagraphNode, $getRoot } from 'lexical'

import { ReactNode, useMemo } from 'react'

import { useURLInfoContext } from '@components/SingleExampleEvaluation/Providers/URLInfoProvider'
import { InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer'
import { PipelineType } from '@utils/types'

import { BadgeNode } from './BadgeNode'
import { useEditor, useEditorsContext } from './EditorProvider'
import { MultipleEditorStorePlugin } from './MultipleEditorStorePlugin'
import classes from './index.module.scss'

interface Props {
  // lexicalId: string
  children: JSX.Element
  // isTextArea?: boolean
  // isTextInput?: boolean
  ids?: string[]
}

export const LexicalWrapper = ({ children, ids }: Props) => {
  const theme = useMemo(
    () => ({
      paragraph: cx(classes['paragraph'], {
        [classes.textAreaLikeInner]: true,
        // [classes.textInputLike]: isTextInput,
      }),
    }),
    [],
  )

  const { preloadedUseCase } = useURLInfoContext()

  const initialEditorIds = useMemo(() => {
    if (preloadedUseCase === null) return []
    else if (preloadedUseCase.type === PipelineType.RUBRIC) {
      return [
        'criteria-description-rubric',
        'criteria-option-0',
        'criteria-option-1',
        'criteria-option-2',
        'criteria-option-3',
        'criteria-option-4',
      ]
    } else if (preloadedUseCase.type === PipelineType.PAIRWISE) {
      return ['criteria-description-pairwise']
    }
    return []
  }, [preloadedUseCase])

  const [id, ...nextIds] = useMemo(() => (ids !== undefined ? ids : initialEditorIds), [initialEditorIds, ids])

  const initialConfig: InitialConfigType = {
    namespace: id,
    onError(error: Error) {
      console.error(error)
    },
    nodes: [BadgeNode],
    theme,
  }

  if (!id) {
    return children
  }

  return (
    <LexicalComposer initialConfig={{ ...initialConfig, namespace: id }} key={id}>
      <LexicalWrapper ids={nextIds}>{children}</LexicalWrapper>
    </LexicalComposer>
  )
}

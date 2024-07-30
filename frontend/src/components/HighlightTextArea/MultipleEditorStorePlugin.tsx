import { id } from 'date-fns/locale'

import { memo, useEffect, useState } from 'react'

import useLatestRef from '@customHooks/useLatestRef'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

import { useEditorsContext, useEditorsMutationContext } from './EditorProvider'

export type MultipleEditorStorePluginProps = {
  children: JSX.Element
  id: string
}

export const MultipleEditorStorePlugin = ({ id, children }: MultipleEditorStorePluginProps) => {
  const [editor] = useLexicalComposerContext()
  const { createEditor, deleteEditor } = useEditorsMutationContext()
  const [created, setCreated] = useState(false)
  useEffect(() => {
    if (id && editor) {
      createEditor(id, editor)
      setCreated(true)

      return () => {
        deleteEditor(id)
      }
    }
  }, [id, editor, createEditor, deleteEditor])

  if (created) {
    return children
  }

  return null
}

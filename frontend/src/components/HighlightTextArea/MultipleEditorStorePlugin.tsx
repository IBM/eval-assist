import { id } from 'date-fns/locale'

import { memo, useEffect, useState } from 'react'

import useLatestRef from '@customHooks/useLatestRef'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

import { useEditorsContext, useEditorsMutationContext } from './EditorProvider'

export type MultipleEditorStorePluginProps = {
  id: string
}

export const MultipleEditorStorePlugin = ({ id }: MultipleEditorStorePluginProps) => {
  const [editor] = useLexicalComposerContext()
  const { createEditor, deleteEditor } = useEditorsMutationContext()

  useEffect(() => {
    if (id && editor) {
      createEditor(id, editor)

      return () => {
        deleteEditor(id)
      }
    }
  }, [id, editor, createEditor, deleteEditor])

  return null
}

import { $getRoot, EditorState, LexicalEditor } from 'lexical'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type EditorMutationsValue = {
  createEditor: (id: string, editor: LexicalEditor) => void
  deleteEditor: (id: string) => void
}

type EditorMap = Record<string, LexicalEditor>

type EditorContextValue = {
  editors: EditorMap
  getEditorById: (id: string) => LexicalEditor
}

const EditorContext = createContext<EditorContextValue | null>(null)
const EditorMutationContext = createContext<EditorMutationsValue | null>(null)

export const EditorProvider = (props: React.PropsWithChildren<{}>) => {
  // const [editorIds, setEditorIds] = useState<string[]>([])
  const [editors, setEditors] = useState<EditorMap>({})

  const createEditor = useCallback((id: string, editor: LexicalEditor) => {
    setEditors((editors) => {
      if (editors[id]) return editors
      return { ...editors, [id]: editor }
    })
  }, [])

  const deleteEditor = useCallback((id: string) => {
    setEditors((editors) => {
      if (!editors[id]) return editors
      const { [id]: _, ...rest } = editors
      return rest
    })
  }, [])

  const getEditorById = (id: string): LexicalEditor => {
    return editors[id]
  }

  const mutationsValue = useMemo(
    () => ({
      createEditor,
      deleteEditor,
    }),
    [createEditor, deleteEditor],
  )

  return (
    <EditorContext.Provider
      value={{
        editors,
        getEditorById,
      }}
    >
      <EditorMutationContext.Provider value={mutationsValue}>{props.children}</EditorMutationContext.Provider>
    </EditorContext.Provider>
  )
}

export const useEditorsContext = (): EditorContextValue => {
  const context = useContext(EditorContext)
  if (context === null) {
    throw new Error(`The \`useEditors\` hook must be used inside the <EditorProvider> component's context.`)
  }
  return context
}

export const useEditorsMutationContext = (): EditorMutationsValue => {
  const context = useContext(EditorMutationContext)
  if (context === null) {
    throw new Error(`The \`useEditors\` hook must be used inside the <EditorProvider> component's context.`)
  }
  return context
}

export const useEditor = (id: string): LexicalEditor | null => {
  const context = useContext(EditorContext)
  if (context === null) {
    throw new Error(`The \`useEditor\` hook must be used inside the <EditorProvider> component's context.`)
  }
  return context.editors[id] || null
}

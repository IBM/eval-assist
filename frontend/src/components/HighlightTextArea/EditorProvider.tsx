import { $getRoot, EditorState, LexicalEditor } from 'lexical'

import { Dispatch, SetStateAction, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type EditorMutationsValue = {
  createEditor: (id: string, editor: LexicalEditor) => void
  deleteEditor: (id: string) => void
}

type EditorMap = Record<string, LexicalEditor>
type TextMap = Record<string, string>

type EditorContextValue = {
  editors: EditorMap
  textContents: TextMap
  onChange: (editorState: EditorState, id: string) => void
  setTextContents: Dispatch<SetStateAction<TextMap>>
  // editorIds: string[]
  // setEditorIds: Dispatch<SetStateAction<string[]>>
}

const EditorContext = createContext<EditorContextValue | null>(null)
const EditorMutationContext = createContext<EditorMutationsValue | null>(null)

export const EditorProvider = (props: React.PropsWithChildren<{}>) => {
  // const [editorIds, setEditorIds] = useState<string[]>([])
  const [editors, setEditors] = useState<EditorMap>({})
  const [textContents, setTextContents] = useState<TextMap>({})
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

  const onChange = (editorState: EditorState, id: string) => {
    setTextContents((currTextContents) => {
      return { ...currTextContents, [id]: editorState.read(() => $getRoot().getTextContent()) }
    })
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
        textContents,
        setTextContents,
        onChange,
        // editorIds,
        // setEditorIds,
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

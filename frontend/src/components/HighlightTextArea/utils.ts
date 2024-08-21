import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $setSelection,
  LexicalEditor,
  LexicalNode,
} from 'lexical'

export const getEditorContents = (editor: LexicalEditor) => {
  return editor.getEditorState().read(() => $getRoot().getTextContent())
}

const getNodes = (text: string) => {
  const lines = text.split('\n')
  return lines.flatMap((text, index) => {
    const res: LexicalNode[] = []
    if (index > 0) {
      res.push($createLineBreakNode())
    }

    if (text) {
      const textNode = $createTextNode(text)
      res.push(textNode)
    }

    return res
  })
}

export const setEditorContent = (value: string, editor: LexicalEditor) => {
  editor.update(() => {
    const root = $getRoot()
    root.clear()
    const paragraphNode = $createParagraphNode()
    root.append(paragraphNode)
    paragraphNode.append(...getNodes(value as string))
    $setSelection(null)
  })
}

export const emptyEditor = (editor: LexicalEditor) => {
  editor.update(() => {
    const root = $getRoot()
    root.clear()
  })
}

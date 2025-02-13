import { KEY_ENTER_COMMAND } from 'lexical'

import { useEffect } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

export const NoEnterPlugin = () => {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent) => {
        // Prevent the default behavior of inserting a new line
        event.preventDefault()
        return true
      },
      0,
    )
  })
  return null
}

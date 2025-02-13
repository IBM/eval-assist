import { $setSelection, TextNode } from 'lexical'

import { useEffect } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

import { BadgeNode } from './BadgeNode'
import { useTextTransform } from './useTextTransform'

interface Props {
  toHighlightWords: {
    contextVariables: string[]
    responseVariableName: string
  }
}

export const MatchPlugin = ({ toHighlightWords }: Props) => {
  const [editor] = useLexicalComposerContext()
  const { textNodeTransform, badgeNodeTransform } = useTextTransform(toHighlightWords)

  useEffect(() => {
    const unregisterTextNodeTransform = editor.registerNodeTransform(TextNode, textNodeTransform)
    const unregisterBadgeNodeTransform = editor.registerNodeTransform(BadgeNode, badgeNodeTransform)
    editor.update(() => {
      $setSelection(null)
    })
    return () => {
      unregisterTextNodeTransform()
      unregisterBadgeNodeTransform()
    }
  }, [badgeNodeTransform, editor, textNodeTransform])
  return null
}

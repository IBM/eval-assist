import { LexicalEditor, TextNode } from 'lexical'

import { useEffect } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

import { $createBadgeNode, BadgeNode } from './BadgeNode'
import { useTextTransform } from './useTextTransform'

interface Props {
  wordList: string[]
}

export const MatchPlugin = ({ wordList }: Props) => {
  const [editor] = useLexicalComposerContext()
  const { textNodeTransform, badgeNodeTransform } = useTextTransform({ wordList })

  useEffect(() => {
    const unregisterTextNodeTransform = editor.registerNodeTransform(TextNode, textNodeTransform)
    const unregisterBadgeNodeTransform = editor.registerNodeTransform(BadgeNode, badgeNodeTransform)
    return () => {
      unregisterTextNodeTransform()
      unregisterBadgeNodeTransform()
    }
  }, [badgeNodeTransform, editor, textNodeTransform])
  return null
}

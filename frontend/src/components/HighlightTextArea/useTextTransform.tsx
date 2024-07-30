import { TextNode } from 'lexical'

import { useCallback } from 'react'

import { $createBadgeNode, BadgeNode } from './BadgeNode'
import { useFindMatch } from './useFindMatch'

export const useTextTransform = ({ wordList }: { wordList: string[] }) => {
  const { findMatch } = useFindMatch({ wordList })

  const textNodeTransform = useCallback(
    (node: TextNode): void => {
      if (!node.isSimpleText() || node.hasFormat('code')) {
        return
      }

      const text = node.getTextContent()

      // Find only 1st occurrence as transform will be re-run anyway for the rest
      // because newly inserted nodes are considered to be dirty
      const match = findMatch(text)
      if (match === null) {
        return
      }
      const splits = node.splitText(match.position, match.position + match.length)

      const badgeNode = $createBadgeNode(match.text)
      splits[match.position === 0 ? 0 : 1].replace(badgeNode)
    },
    [findMatch],
  )

  const badgeNodeTransform = useCallback(
    (node: BadgeNode): void => {
      const text = node.getTextContent()
      const match = findMatch(text)
      if (match === null) {
        node.replace(new TextNode(text))
        return
      }
      const splits = node.splitText(match.position, match.position + match.length)
      if (splits.length > 1) {
        splits[1].replace(new TextNode(splits[1].getTextContent()))
      }
    },
    [findMatch],
  )

  return {
    textNodeTransform,
    badgeNodeTransform,
  }
}

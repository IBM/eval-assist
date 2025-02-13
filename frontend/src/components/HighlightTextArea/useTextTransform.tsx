import { TextNode } from 'lexical'

import { useCallback, useMemo } from 'react'

import { $createBadgeNode, BadgeNode } from './BadgeNode'
import { useFindMatch } from './useFindMatch'

interface Props {
  contextVariables: string[]
  responseVariableName: string
}

export const useTextTransform = ({ contextVariables, responseVariableName }: Props) => {
  const responseVariableNameAsList = useMemo(() => [responseVariableName], [responseVariableName])
  const { findMatch: findContextVariablesMatch } = useFindMatch({ wordList: contextVariables })
  const { findMatch: findResponseVariableMatch } = useFindMatch({ wordList: responseVariableNameAsList })

  const textNodeTransform = useCallback(
    (node: TextNode): void => {
      const text = node.getTextContent()
      // Find only 1st occurrence as transform will be re-run anyway for the rest
      // because newly inserted nodes are considered to be dirty
      const match = findContextVariablesMatch(text) || findResponseVariableMatch(text)
      if (match === null) {
        return
      }
      const splits = node.splitText(match.position, match.position + match.length)

      const badgeNode = $createBadgeNode(
        text.substring(match.position, match.position + match.length),
        match.text === responseVariableName,
      )
      splits[match.position === 0 ? 0 : 1].replace(badgeNode)
    },
    [findContextVariablesMatch, findResponseVariableMatch, responseVariableName],
  )

  const badgeNodeTransform = useCallback(
    (node: BadgeNode): void => {
      const text = node.getTextContent()
      const match = findContextVariablesMatch(text) || findResponseVariableMatch(text)
      if (match === null) {
        node.replace(new TextNode(text))
        return
      }
      const splits = node.splitText(match.position, match.position + match.length)
      if (splits.length > 1) {
        splits[1].replace(new TextNode(splits[1].getTextContent()))
      }
    },
    [findContextVariablesMatch, findResponseVariableMatch],
  )

  return {
    textNodeTransform,
    badgeNodeTransform,
  }
}

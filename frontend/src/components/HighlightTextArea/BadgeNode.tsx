import { SerializedTextNode, TextNode } from 'lexical'
import { NodeKey } from 'lexical/LexicalNode'

import classes from './index.module.scss'

export class BadgeNode extends TextNode {
  static getType(): string {
    return 'badge'
  }

  static clone(node: BadgeNode): BadgeNode {
    return new BadgeNode(node.__text, node.__key)
  }

  constructor(text: string, key?: NodeKey) {
    super(text, key)
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span')
    span.className = classes['matchColor']
    span.textContent = this.__text
    return span
  }

  static importJSON(serializedNode: SerializedTextNode): BadgeNode {
    // return $createEmojiNode(serializedNode.unifiedID)
    return $createBadgeNode(serializedNode.text)
  }

  exportJSON(): SerializedTextNode {
    return {
      ...super.exportJSON(),
      type: 'badge',
    }
  }
}

export const $createBadgeNode = (text: string) => {
  return new BadgeNode(text)
}

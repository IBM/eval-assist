import { SerializedTextNode, TextNode } from 'lexical'
import { NodeKey } from 'lexical/LexicalNode'

import classes from './index.module.scss'

export class BadgeNode extends TextNode {
  isResponseVariable: boolean
  static getType(): string {
    return 'badge'
  }

  static clone(node: BadgeNode): BadgeNode {
    return new BadgeNode(node.__text, node.isResponseVariable, node.__key)
  }

  constructor(text: string, isResponseVariable: boolean, key?: NodeKey) {
    super(text, key)
    this.isResponseVariable = isResponseVariable
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span')
    span.className = this.isResponseVariable ? classes.matchColorBlue : classes.matchColorPurple
    span.textContent = this.__text
    return span
  }

  static importJSON(serializedNode: SerializedTextNode): BadgeNode {
    return $createBadgeNode(serializedNode.text, false)
  }

  exportJSON(): SerializedTextNode {
    return {
      ...super.exportJSON(),
      type: 'badge',
    }
  }
}

export const $createBadgeNode = (text: string, isResponseVariable: boolean) => {
  return new BadgeNode(text, isResponseVariable)
}

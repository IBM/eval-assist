import cx from 'classnames'
import { SerializedTextNode, TextNode } from 'lexical'
import { NodeKey } from 'lexical/LexicalNode'

import classes from './index.module.scss'

interface SerializedBadgeNode extends SerializedTextNode {
  isResponseVariable: boolean
}

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
    span.className = cx('cds--tag', 'cds--layout--size-sm', classes.tag, {
      'cds--tag--blue': this.isResponseVariable,
      'cds--tag--purple': !this.isResponseVariable,
    })
    span.textContent = this.__text
    return span
  }

  static importJSON(serializedNode: SerializedBadgeNode): BadgeNode {
    return $createBadgeNode(serializedNode.text, serializedNode.isResponseVariable)
  }

  exportJSON(): SerializedBadgeNode {
    return {
      ...super.exportJSON(),
      type: 'badge',
      isResponseVariable: this.isResponseVariable,
    }
  }
}

export const $createBadgeNode = (text: string, isResponseVariable: boolean) => {
  return new BadgeNode(text, isResponseVariable)
}

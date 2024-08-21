import cx from 'classnames'
import { v4 as uuid } from 'uuid'

import { useEditor } from './EditorProvider'

interface Props {
  isTextArea: boolean
  isTextInput: boolean
  className: string | undefined
  labelText: React.ReactNode
  children: React.ReactNode
}

export const CarbonWrapper = ({ isTextArea, isTextInput, className, labelText, children }: Props) => {
  return isTextInput ? (
    <div className={cx('cds--form-item', 'cds--text-input-wrapper', className)} style={{ overflow: 'hidden' }}>
      <div className="cds--text-input__label-wrapper">
        <label htmlFor="text-area-evaluation-instruction" className="cds--label">
          {labelText}
        </label>
      </div>
      <div className="cds--text-input__field-outer-wrapper">
        <div className="cds--text-input__field-wrapper">{children}</div>
      </div>
    </div>
  ) : isTextArea ? (
    <div className={cx('cds--form-item', className)}>
      <div className={cx('cds--text-area-label-wrapper')}>
        <label htmlFor="text-area-evaluation-instruction" className="cds--label">
          {labelText}
        </label>
      </div>
      <div className="cds--text-area__wrapper">
        <div className="cds--text-input__field-wrapper">{children}</div>
      </div>
    </div>
  ) : null
}

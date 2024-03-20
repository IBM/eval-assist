import { Dispatch, SetStateAction } from 'react'

import { ChevronDown, ChevronUp } from '@carbon/icons-react'
import { Button } from '@carbon/react'

interface CollapseButtonsInterface {
  shouldUseCollapse: boolean
  isCollapsed: boolean
  setIsCollapsed: Dispatch<SetStateAction<boolean>>
}

export const CollapseButtons = ({ shouldUseCollapse, isCollapsed, setIsCollapsed }: CollapseButtonsInterface) => {
  return (
    shouldUseCollapse && (
      <div style={{ maxHeight: '20px', marginTop: '10px' }}>
        {isCollapsed ? (
          <Button
            style={{ paddingLeft: '0px' }}
            kind="ghost"
            size="sm"
            renderIcon={ChevronDown}
            onClick={() => setIsCollapsed(false)}
          >
            Show more
          </Button>
        ) : (
          <Button
            style={{ paddingLeft: '0px' }}
            kind="ghost"
            size="sm"
            renderIcon={ChevronUp}
            onClick={() => setIsCollapsed(true)}
          >
            Show less
          </Button>
        )}
      </div>
    )
  )
}

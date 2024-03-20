import { useEffect, useState } from 'react'

interface UseCollapseProps {
  elementRef: React.MutableRefObject<HTMLElement | null>
  collapseTreshhold: number
}

export const useCollapse = ({ elementRef, collapseTreshhold }: UseCollapseProps) => {
  const [shouldUseCollapse, setShouldUseCollapse] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [originalHeightSet, setOriginalHeightSet] = useState(false)

  // used to get the height of the element to position the pos pred icon in the middle
  // eslint-disable-next-line
  useEffect(() => {
    if (elementRef.current !== null && originalHeightSet === false) {
      const height = elementRef.current.clientHeight
      setOriginalHeightSet(true)
      setShouldUseCollapse(height > collapseTreshhold)
    }
  }, [collapseTreshhold, elementRef, originalHeightSet])

  return { shouldUseCollapse, isCollapsed, setIsCollapsed }
}

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

export const useAutosizeTextArea = () => {
  const textAreasRef = useRef<HTMLTextAreaElement[]>([])

  const updateSize = useCallback(() => {
    textAreasRef.current.forEach((textArea) => {
      autoUpdateSize(textArea)
    })
  }, [textAreasRef])

  // Listen for change to window
  useLayoutEffect(() => {
    window.addEventListener('resize', updateSize)
    updateSize()
    return () => window.removeEventListener('resize', updateSize)
  })

  useEffect(() => {
    updateSize()
  })

  const addToRefs = useCallback(
    (el: HTMLTextAreaElement) => {
      if (el && !textAreasRef.current?.includes(el)) {
        textAreasRef.current.push(el)
      }
    },
    [textAreasRef],
  )

  const autoUpdateSize = (e: HTMLTextAreaElement) => {
    if (e) {
      e.style.height = '0px'
      const scrollHeight = e.scrollHeight
      e.style.height = scrollHeight + 1 + 'px'
    }
  }

  return { textAreasRef, addToRefs, autoUpdateSize }
}

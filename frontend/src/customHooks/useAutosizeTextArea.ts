import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

export const useAutosizeTextArea = () => {
  const textAreasRef = useRef<HTMLTextAreaElement[]>([])
  const textFollowersRef = useRef<HTMLTextAreaElement[]>([])

  const updateSize = useCallback(() => {
    textAreasRef.current.forEach((textArea) => {
      autoUpdateSize(textArea)
    })
  }, [textAreasRef])

  const replicateSize = useCallback(() => {
    textFollowersRef.current.forEach((_, i) => {
      autoReplicateSize(textAreasRef.current[i], textFollowersRef.current[i])
    })
  }, [textAreasRef])

  const updateAndReplicate = useCallback(() => {
    updateSize()
    replicateSize()
  }, [updateSize, replicateSize])

  // Listen for change to window
  useLayoutEffect(() => {
    window.addEventListener('resize', updateAndReplicate)
    updateSize()
    replicateSize()
    return () => window.removeEventListener('resize', updateAndReplicate)
  })

  useEffect(() => {
    updateSize()
    replicateSize()
  })

  const addToMainsRef = useCallback(
    (el: HTMLTextAreaElement) => {
      if (el && !textAreasRef.current?.includes(el)) {
        textAreasRef.current.push(el)
      }
    },
    [textAreasRef],
  )

  const addToFollowersRef = useCallback(
    (el: HTMLTextAreaElement) => {
      if (el && !textFollowersRef.current?.includes(el)) {
        textFollowersRef.current.push(el)
      }
    },
    [textFollowersRef],
  )

  const autoUpdateSize = (e: HTMLTextAreaElement) => {
    if (e) {
      e.style.height = '0px'
      const scrollHeight = e.scrollHeight
      e.style.height = scrollHeight + 1 + 'px'
    }
  }

  const autoReplicateSize = (from: HTMLTextAreaElement, to: HTMLTextAreaElement) => {
    if (from && to) {
      to.style.height = from.style.height
    }
  }

  return { textAreasRef, textFollowersRef, addToMainsRef, addToFollowersRef, autoUpdateSize, autoReplicateSize }
}

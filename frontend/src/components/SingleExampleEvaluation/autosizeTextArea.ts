import { useEffect } from 'react'

export const useAutosizeTextArea = (textAreaRefs: HTMLTextAreaElement[]) => {
  useEffect(() => {
    textAreaRefs.forEach(function (ref) {
      if (ref) autoUpdateSize(ref)
    })
  }, [textAreaRefs])
}

export const autoUpdateSize = (e: HTMLTextAreaElement) => {
  if (e) {
    e.style.height = '0px'
    const scrollHeight = e.scrollHeight
    e.style.height = scrollHeight + 1 + 'px'
  }
}

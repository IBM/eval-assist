import { Dispatch, ReactNode, SetStateAction, createContext, useContext, useEffect, useState } from 'react'

interface SelectedTextContextValue {
  selectedText: string
  setSelectedText: Dispatch<SetStateAction<string>>
  isMouseUp: boolean
}

const SelectedTextContext = createContext<SelectedTextContextValue>({
  selectedText: '',
  setSelectedText: () => {},
  isMouseUp: false,
})

export const useSelectedTextContext = () => {
  return useContext(SelectedTextContext)
}

export const SelectedTextProvider = ({ children }: { children: ReactNode }) => {
  const [selectedText, setSelectedText] = useState<string>('')
  const [isMouseUp, setIsMouseUp] = useState<boolean>(false)
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection()
      if (selection) {
        setSelectedText(selection.toString())
      }
    }
    const handleMouseUp = () => {
      setIsMouseUp(true)
    }
    const handleMouseDown = () => {
      setIsMouseUp(false)
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('selectionchange', handleSelectionChange)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [])

  return (
    <SelectedTextContext.Provider
      value={{
        selectedText,
        setSelectedText,
        isMouseUp,
      }}
    >
      {children}
    </SelectedTextContext.Provider>
  )
}

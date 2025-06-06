import { useCallback } from 'react'

export type Match = Readonly<{
  position: number
  length: number
  text: string
}>

export const useFindMatch = ({ wordList }: { wordList: string[] }) => {
  const findMatch = useCallback(
    (text: string): Match | null => {
      for (const word of wordList) {
        if (word === '') continue
        const matchIndex = text.toLowerCase().indexOf(word.toLowerCase())
        if (matchIndex == -1) continue

        return {
          position: matchIndex,
          length: word.length,
          text: word,
        }
      }
      return null
    },
    [wordList],
  )

  return { findMatch }
}

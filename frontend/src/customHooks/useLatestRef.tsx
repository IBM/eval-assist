import { useRef } from 'react'
import { useEffect, useLayoutEffect } from 'react'

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default function useLatestRef<T>(value: T) {
  const latestRef = useRef(value)
  useIsomorphicLayoutEffect(() => {
    latestRef.current = value
  })
  return latestRef
}

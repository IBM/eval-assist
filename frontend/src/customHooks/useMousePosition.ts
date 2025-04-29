import React from 'react'

export const useMousePosition = () => {
  const [mousePosition, setMousePosition] = React.useState<{ x: number | null; y: number | null }>({ x: null, y: null })
  React.useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      setMousePosition({ x: ev.offsetX, y: ev.offsetY })
    }
    window.addEventListener('mousemove', updateMousePosition)
    return () => {
      window.removeEventListener('mousemove', updateMousePosition)
    }
  }, [])
  return mousePosition
}

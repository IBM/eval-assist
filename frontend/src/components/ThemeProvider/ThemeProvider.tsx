import cx from 'classnames'

import { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

import { moderate02 } from '@carbon/motion'
import { usePrefix } from '@carbon/react'

import classes from './ThemeProvider.module.scss'

export type PropsWithChildren<P = unknown> = P & { children: ReactNode }

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<Theme | null>(null)
  const [showOverlay, setShowOverlay] = useState<boolean>(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const prefix = usePrefix()

  const updateDocumentTheme = useCallback(
    (theme: Theme) => {
      // we need to set theme directly to the root element to avoid "overscroll"
      // color mismatch in background when using Carbon's Theme component
      document.documentElement.classList.remove(`${prefix}--${CarbonTheme.Light}`, `${prefix}--${CarbonTheme.Dark}`)
      document.documentElement.classList.add(`${prefix}--${getCarbonThemeValue(theme)}`)
    },
    [prefix],
  )

  const updateTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem(THEME_KEY, newTheme)
  }, [])

  useEffect(() => {
    let currentTheme = theme
    if (!currentTheme) {
      const storedTheme = localStorage.getItem(THEME_KEY)
      currentTheme = storedTheme === Theme.Dark || storedTheme === Theme.Light ? storedTheme : Theme.System
    }
    if (localStorage && !theme) setTheme(currentTheme)

    updateDocumentTheme(currentTheme)

    if (showOverlay) timeoutRef.current = setTimeout(() => setShowOverlay(false), LOADER_FADEOUT_DURATION)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [prefix, showOverlay, theme, updateDocumentTheme, updateTheme])

  const handleSystemSchemeChange = useCallback(
    (event: MediaQueryListEvent) => {
      if (theme === Theme.System) updateDocumentTheme(theme)
    },
    [theme, updateDocumentTheme],
  )

  useEffect(() => {
    const matchMediaDarkScheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
    matchMediaDarkScheme?.addEventListener('change', handleSystemSchemeChange)

    return () => matchMediaDarkScheme?.removeEventListener('change', handleSystemSchemeChange)
  }, [handleSystemSchemeChange])

  const isDarkMode = useCallback(() => {
    return theme === Theme.Dark || (theme === Theme.System && isSystemPreferedDark())
  }, [theme])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: updateTheme,
        isDarkMode,
      }}
    >
      {children}
      {showOverlay && <div className={cx(classes.noThemeOverlay, { [classes.hide]: theme })} />}
    </ThemeContext.Provider>
  )
}

interface ThemeContextValue {
  theme: Theme | null
  setTheme: (newTheme: Theme) => void
  isDarkMode: () => boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: null,
  setTheme: () => {},
  isDarkMode: () => false,
})

export function useThemeContext() {
  return useContext(ThemeContext)
}

const THEME_KEY = 'theme'
const LOADER_FADEOUT_DURATION = parseInt(moderate02)

export enum Theme {
  Light = 'white',
  Dark = 'dark',
  System = 'system',
}

export enum CarbonTheme {
  Light = 'white',
  Dark = 'g100',
}

function getCarbonThemeValue(theme: Theme) {
  if (theme === Theme.Light) return CarbonTheme.Light
  if (theme === Theme.Dark) return CarbonTheme.Dark

  return isSystemPreferedDark() ? CarbonTheme.Dark : CarbonTheme.Light
}

function isSystemPreferedDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

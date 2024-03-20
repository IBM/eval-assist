import React, { createContext, useContext, useEffect, useState } from 'react'

import { GlobalTheme } from '@carbon/react'

export const setInitialThemeScript = `
  function validateTheme(theme) {
    const validThemes = ['white', 'g10', 'g90', 'g100'];
    return validThemes.find(function(validTheme) {return theme === validTheme});
  }
  function getThemePreference() {
    const savedTheme = window.localStorage.getItem('carbon-theme');
    const validSavedTheme = savedTheme ? validateTheme(savedTheme) : null;
    const systemPreferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'g100'
      : 'white';
    const themePreference = validSavedTheme ? validSavedTheme : systemPreferredTheme;
    return themePreference;
  }
  document.documentElement.setAttribute('data-carbon-theme', getThemePreference());
`

type ThemeValue = 'white' | 'g10' | 'g90' | 'g100' | undefined

type ThemePreferenceContext =
  | {
      theme: ThemeValue
      setTheme: React.Dispatch<React.SetStateAction<ThemeValue>>
    }
  | undefined

const ThemePreferenceContext = createContext<ThemePreferenceContext>(undefined)

export function useThemePreference() {
  return useContext(ThemePreferenceContext)!
}

export const ThemePreference: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeValue>(undefined)
  const contextValue = {
    theme,
    setTheme,
  }

  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-carbon-theme') as ThemeValue)
  }, [])

  useEffect(() => {
    if (theme) {
      window.localStorage.setItem('carbon-theme', theme)
      if (document.documentElement.getAttribute('data-carbon-theme') !== theme)
        document.documentElement.setAttribute('data-carbon-theme', theme)
    }
  }, [theme])

  return (
    <ThemePreferenceContext.Provider value={contextValue}>
      <GlobalTheme theme={theme}>{children}</GlobalTheme>
    </ThemePreferenceContext.Provider>
  )
}

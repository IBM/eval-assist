import { ReactNode } from 'react'

import { unstable_FeatureFlags as FeatureFlags } from '@carbon/react'

import { AppHeader } from '@components/AppHeader/AppHeader'
import { ThemeProvider } from '@components/ThemeProvider/ThemeProvider'
import { ToastProvider } from '@providers/ToastProvider'

import classes from './AppShell.module.scss'

interface Props {
  children: ReactNode
}

export const AppShell = ({ children }: Props) => {
  return (
    <ThemeProvider>
      <FeatureFlags flags={{ 'enable-treeview-controllable': true }}>
        <>
          <AppHeader />
          <ToastProvider>
            <main id="main-content" className={classes.content}>
              {children}
            </main>
          </ToastProvider>
        </>
      </FeatureFlags>
    </ThemeProvider>
  )
}

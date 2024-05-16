import cx from 'classnames'

import { ReactNode } from 'react'

import { unstable_FeatureFlags as FeatureFlags } from '@carbon/react'

import { AppHeader } from '@components/AppHeader/AppHeader'
import ThemePreference from '@components/ThemePreference'
import { ToastProvider } from '@components/ToastProvider/ToastProvider'

import classes from './AppShell.module.scss'

interface Props {
  children: ReactNode
}

export const AppShell = ({ children }: Props) => {
  return (
    <ThemePreference>
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
    </ThemePreference>
  )
}

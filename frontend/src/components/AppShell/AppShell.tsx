import cx from 'classnames'

import { ReactNode } from 'react'

import { useSession } from 'next-auth/react'

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
      <>
        <AppHeader />
        <ToastProvider>
          <main id="main-content" className={classes.content}>
            {children}
          </main>
        </ToastProvider>
      </>
    </ThemePreference>
  )
}

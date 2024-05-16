import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import {
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
  Theme,
} from '@carbon/react'
import { Document, Logout } from '@carbon/react/icons'

import { PLATFORM_NAME } from '@constants'
import { useAuthentication } from '@customHooks/useAuthentication'

import classes from './AppHeader.module.scss'

export const AppHeader = () => {
  const title = `IBM ${PLATFORM_NAME}`
  const { authenticationEnabled } = useAuthentication()
  const router = useRouter()

  return (
    <Theme theme="g100">
      <Header className={classes.root} aria-label={title}>
        <HeaderName href="/" prefix="IBM" as={Link}>
          {PLATFORM_NAME}
        </HeaderName>

        <HeaderGlobalBar>
          {router.pathname === '/documentation' ? null : (
            <HeaderNavigation aria-label="IBM [Platform]">
              <HeaderMenuItem href="/documentation">
                <div style={{ display: 'flex', flexDirection: 'row', alignContent: 'center' }}>
                  Documentation
                  <Document style={{ marginLeft: '0.5rem' }} size={18} />
                </div>
              </HeaderMenuItem>
            </HeaderNavigation>
          )}

          {authenticationEnabled && (
            <HeaderGlobalAction aria-label="Logout" onClick={signOut}>
              <Logout size={20} />
            </HeaderGlobalAction>
          )}
        </HeaderGlobalBar>
      </Header>
    </Theme>
  )
}

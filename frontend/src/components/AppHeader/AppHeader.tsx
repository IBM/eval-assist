import { PLATFORM_NAME } from 'src/constants'

import { signOut } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/router'

import {
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
} from '@carbon/react'
import { Document, LogoGithub, Logout, QqPlot } from '@carbon/react/icons'

import { useAuthentication } from '@customHooks/useAuthentication'

import classes from './AppHeader.module.scss'

export const AppHeader = () => {
  const title = `${PLATFORM_NAME}`
  const { authenticationEnabled, isAuthenticated } = useAuthentication()
  const router = useRouter()

  return (
    <Header className={classes.root} aria-label={title}>
      <HeaderName prefix={''} style={{ cursor: 'pointer' }} href="/">
        <Image width={16} height={16} src={`images/logo.svg`} alt={'title'} style={{ marginRight: '0.25rem' }} />
        {PLATFORM_NAME}
      </HeaderName>

      <HeaderGlobalBar>
        <HeaderNavigation aria-label="[Platform]">
          <HeaderMenuItem href="/documentation" isActive={router.pathname === '/documentation'}>
            <div style={{ display: 'flex', flexDirection: 'row', alignContent: 'center' }}>
              Documentation
              <Document style={{ marginLeft: '0.5rem' }} size={18} />
            </div>
          </HeaderMenuItem>
          <HeaderMenuItem href="/benchmarks" isActive={router.pathname.startsWith('/benchmarks')}>
            <div style={{ display: 'flex', flexDirection: 'row', alignContent: 'center' }}>
              Benchmarks
              <QqPlot style={{ marginLeft: '0.5rem' }} size={18} />
            </div>
          </HeaderMenuItem>
          <HeaderMenuItem
            href="https://github.ibm.com/AIExperience/eval-assist"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div style={{ display: 'flex', flexDirection: 'row', alignContent: 'center' }}>
              Github
              <LogoGithub style={{ marginLeft: '0.5rem' }} size={18} />
            </div>
          </HeaderMenuItem>
        </HeaderNavigation>

        {authenticationEnabled && isAuthenticated && (
          <HeaderGlobalAction aria-label="Logout" onClick={signOut}>
            <Logout size={20} />
          </HeaderGlobalAction>
        )}
      </HeaderGlobalBar>
    </Header>
  )
}

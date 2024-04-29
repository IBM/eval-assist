import { useState } from 'react'
import { useMediaQuery } from 'react-responsive'

import Link from 'next/link'

import {
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderName,
  SideNav,
  SideNavItems,
  SideNavLink,
  SideNavMenu,
  SideNavMenuItem,
  Theme,
} from '@carbon/react'
import { Categories, Help } from '@carbon/react/icons'

import { PLATFORM_NAME } from '@constants'

export const AppHeader = () => {
  const sm = useMediaQuery({ query: '(max-width: 671px)' })
  const title = `IBM ${PLATFORM_NAME}`
  const [isSideNavExpanded, setIsSideNavExpanded] = useState(false)
  return (
    <>
      <Theme theme="g100">
        <Header aria-label={title}>
          <HeaderName href="/" prefix="IBM" as={Link}>
            {PLATFORM_NAME}
          </HeaderName>
          <HeaderGlobalBar>
            <HeaderGlobalAction aria-label="Help">
              <Help size={20} />
            </HeaderGlobalAction>
          </HeaderGlobalBar>
        </Header>
      </Theme>

      <SideNav
        aria-label="Side navigation"
        onOverlayClick={() => setIsSideNavExpanded(!isSideNavExpanded)}
        onSideNavBlur={() => setIsSideNavExpanded(!isSideNavExpanded)}
        isRail
      >
        <SideNavItems>
          <SideNavMenu renderIcon={Categories} title="Use Case Library" defaultExpanded>
            <SideNavLink onClick={() => alert('hola')}>Use Case 1</SideNavLink>
            <SideNavLink>Use Case 2</SideNavLink>
            <SideNavLink>Use Case 3</SideNavLink>
          </SideNavMenu>
        </SideNavItems>
      </SideNav>
    </>
  )
}

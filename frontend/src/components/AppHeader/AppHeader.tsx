import { Dispatch, SetStateAction, useState } from 'react'
import { useMediaQuery } from 'react-responsive'

import Link from 'next/link'

import {
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderMenuButton,
  HeaderName,
  SideNav,
  SideNavItems,
  SideNavLink,
  SideNavMenu,
  Theme,
} from '@carbon/react'
import { Categories, Help } from '@carbon/react/icons'
import classes from '@styles/SingleExampleEvaluation.module.scss'

import { UseCase, useCases } from '@components/SingleExampleEvaluation/UseCases'
import { PLATFORM_NAME } from '@constants'

interface AppHeaderProps {
  setOpen: Dispatch<SetStateAction<boolean>>
  setUseCaseSelected: Dispatch<SetStateAction<UseCase | null>>
}

export const AppHeader = ({ setOpen, setUseCaseSelected }: AppHeaderProps) => {
  const sm = useMediaQuery({ query: '(max-width: 671px)' })
  const title = `IBM ${PLATFORM_NAME}`
  const [isSideNavExpanded, setIsSideNavExpanded] = useState(false)
  return (
    <>
      <Theme theme="g100">
        <Header aria-label={title}>
          <HeaderMenuButton
            aria-label="Open menu"
            onClick={() => setIsSideNavExpanded(!isSideNavExpanded)}
            isActive={isSideNavExpanded}
            style={{ display: 'inherit' }}
          />
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
        isPersistent={false}
        // onOverlayClick={() => setIsSideNavExpanded(!isSideNavExpanded)}
        // onSideNavBlur={() => setIsSideNavExpanded(!isSideNavExpanded)}
        onMouseEnter={(e) => e.preventDefault()}
        onMouseLeave={(e) => e.preventDefault()}
        expanded={isSideNavExpanded}
        // isRail
        className={isSideNavExpanded ? classes['custom-sidenav'] : ''}
      >
        <SideNavItems>
          <SideNavMenu renderIcon={Categories} title="Use Case Library" defaultExpanded={true}>
            {useCases.map((useCase) => (
              <SideNavLink
                isActive={false}
                key={useCase.name}
                onClick={() => {
                  setOpen(true)
                  setUseCaseSelected(useCase)
                }}
                style={{ cursor: 'pointer' }}
              >
                {useCase.name}
              </SideNavLink>
            ))}
          </SideNavMenu>
        </SideNavItems>
      </SideNav>
    </>
  )
}

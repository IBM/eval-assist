import { Dispatch, SetStateAction } from 'react'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import {
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderMenuButton,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
  SideNav,
  SideNavItems,
  SideNavLink,
  SideNavMenu,
  Theme,
} from '@carbon/react'
import { Categories, Document, DocumentSigned, Help, Logout, WatsonHealthSaveAnnotation } from '@carbon/react/icons'
import classes from '@styles/SingleExampleEvaluation.module.scss'

import { useCases } from '@components/SingleExampleEvaluation/UseCasesLibrary'
import { UseCase } from '@components/SingleExampleEvaluation/types'
import { PLATFORM_NAME } from '@constants'
import { useAuthentication } from '@customHooks/useAuthentication'

interface AppSidenavProps {
  setConfirmationModalOpen: Dispatch<SetStateAction<boolean>>
  setLibraryUseCaseSelected: Dispatch<SetStateAction<UseCase | null>>
  isSideNavExpanded: boolean
  userUseCases: UseCase[]
  currentUseCaseId: number | null
}

export const AppSidenav = ({
  setConfirmationModalOpen,
  setLibraryUseCaseSelected,
  isSideNavExpanded,
  userUseCases,
  currentUseCaseId,
}: AppSidenavProps) => {
  return (
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
        <SideNavMenu renderIcon={Categories} title="Use Case Library" defaultExpanded={false}>
          {useCases.map((useCase) => (
            <SideNavLink
              isActive={false}
              key={useCase.name}
              onClick={() => {
                setConfirmationModalOpen(true)
                setLibraryUseCaseSelected(useCase)
              }}
              style={{ cursor: 'pointer' }}
            >
              {useCase.name}
            </SideNavLink>
          ))}
        </SideNavMenu>
        <SideNavMenu renderIcon={WatsonHealthSaveAnnotation} title="My Use Cases">
          {userUseCases.map((useCase, i) => (
            <SideNavLink
              key={i}
              isActive={currentUseCaseId === useCase.id}
              onClick={() => {
                if (currentUseCaseId === useCase.id) return
                setConfirmationModalOpen(true)
                setLibraryUseCaseSelected(useCase)
              }}
              style={{ cursor: currentUseCaseId === useCase.id ? 'default' : 'pointer' }}
            >
              {useCase.name}
            </SideNavLink>
          ))}
        </SideNavMenu>
      </SideNavItems>
    </SideNav>
  )
}

interface AppHeaderProps {
  setConfirmationModalOpen?: Dispatch<SetStateAction<boolean>>
  setLibraryUseCaseSelected?: Dispatch<SetStateAction<UseCase | null>>
  userUseCases?: UseCase[]
  isSideNavExpanded?: boolean
  setIsSideNavExpanded?: Dispatch<SetStateAction<boolean>>
  currentUseCaseId?: number | null
  displaySidenav: boolean
}

export const AppHeader = ({
  setConfirmationModalOpen,
  setLibraryUseCaseSelected,
  userUseCases,
  isSideNavExpanded,
  setIsSideNavExpanded,
  currentUseCaseId,
  displaySidenav = true,
}: AppHeaderProps) => {
  const title = `IBM ${PLATFORM_NAME}`
  const { authenticationEnabled } = useAuthentication()
  return (
    <>
      <Theme theme="g100">
        <Header aria-label={title}>
          {displaySidenav && setIsSideNavExpanded && (
            <HeaderMenuButton
              aria-label="Open menu"
              onClick={() => setIsSideNavExpanded(!isSideNavExpanded)}
              isActive={isSideNavExpanded}
              style={{ display: 'inherit' }}
            />
          )}
          <HeaderName href="/" prefix="IBM" as={Link}>
            {PLATFORM_NAME}
          </HeaderName>

          <HeaderGlobalBar>
            <HeaderNavigation aria-label="IBM [Platform]">
              <HeaderMenuItem href="/documentation" target="_blank" rel="noopener noreferrer">
                <div style={{ display: 'flex', flexDirection: 'row', alignContent: 'center' }}>
                  Documentation
                  <Document style={{ marginLeft: '0.5rem' }} size={18} />
                </div>
              </HeaderMenuItem>
            </HeaderNavigation>

            {authenticationEnabled && (
              <HeaderGlobalAction aria-label="Logout" onClick={signOut}>
                <Logout size={20} />
              </HeaderGlobalAction>
            )}
          </HeaderGlobalBar>
        </Header>
      </Theme>
      {displaySidenav &&
        // this checks are just to make ts happy
        setConfirmationModalOpen !== undefined &&
        setLibraryUseCaseSelected !== undefined &&
        isSideNavExpanded !== undefined &&
        userUseCases !== undefined &&
        currentUseCaseId !== undefined && (
          <AppSidenav
            setConfirmationModalOpen={setConfirmationModalOpen}
            setLibraryUseCaseSelected={setLibraryUseCaseSelected}
            isSideNavExpanded={isSideNavExpanded}
            userUseCases={userUseCases}
            currentUseCaseId={currentUseCaseId}
          />
        )}
    </>
  )
}

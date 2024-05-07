import { Dispatch, SetStateAction, useState } from 'react'

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
import { Categories, DocumentSigned, Help, WatsonHealthSaveAnnotation } from '@carbon/react/icons'
import classes from '@styles/SingleExampleEvaluation.module.scss'

import { useCases } from '@components/SingleExampleEvaluation/UseCasesLibrary'
import { UseCase } from '@components/SingleExampleEvaluation/types'
import { PLATFORM_NAME } from '@constants'

interface AppSidenavProps {
  setConfirmationModalOpen: Dispatch<SetStateAction<boolean>>
  setLibraryUseCaseSelected: Dispatch<SetStateAction<UseCase | null>>
  isSideNavExpanded: boolean
  savedUseCases: UseCase[]
  currentUseCaseId: number | null
}

export const AppSidenav = ({
  setConfirmationModalOpen,
  setLibraryUseCaseSelected,
  isSideNavExpanded,
  savedUseCases,
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
          {savedUseCases.map((useCase, i) => (
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
        <SideNavMenu renderIcon={DocumentSigned} title="Documentation">
          <SideNavLink style={{ cursor: 'pointer' }}>{'Overview'}</SideNavLink>
          <SideNavLink style={{ cursor: 'pointer' }}>{'Criteria definition'}</SideNavLink>
          <SideNavLink style={{ cursor: 'pointer' }}>{'Installation'}</SideNavLink>
          <SideNavLink style={{ cursor: 'pointer' }}>{'Usage'}</SideNavLink>
        </SideNavMenu>
      </SideNavItems>
    </SideNav>
  )
}

interface AppHeaderProps {
  setConfirmationModalOpen: Dispatch<SetStateAction<boolean>>
  setLibraryUseCaseSelected: Dispatch<SetStateAction<UseCase | null>>
  savedUseCases: UseCase[]
  isSideNavExpanded: boolean
  setIsSideNavExpanded: Dispatch<SetStateAction<boolean>>
  currentUseCaseId: number | null
}

export const AppHeader = ({
  setConfirmationModalOpen,
  setLibraryUseCaseSelected,
  savedUseCases,
  isSideNavExpanded,
  setIsSideNavExpanded,
  currentUseCaseId,
}: AppHeaderProps) => {
  const title = `IBM ${PLATFORM_NAME}`
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
      <AppSidenav
        setConfirmationModalOpen={setConfirmationModalOpen}
        setLibraryUseCaseSelected={setLibraryUseCaseSelected}
        isSideNavExpanded={isSideNavExpanded}
        savedUseCases={savedUseCases}
        currentUseCaseId={currentUseCaseId}
      />
    </>
  )
}

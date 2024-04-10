import { useMediaQuery } from 'react-responsive'

import Link from 'next/link'

import { Header, HeaderGlobalAction, HeaderGlobalBar, HeaderName } from '@carbon/react'
import { Help } from '@carbon/react/icons'

import { PLATFORM_NAME } from '@constants'

export const AppHeader = () => {
  const sm = useMediaQuery({ query: '(max-width: 671px)' })
  const title = `IBM ${PLATFORM_NAME}`

  return (
    <Header aria-label={title}>
      {sm ? (
        <HeaderName href="/" prefix="IBM" as={Link}>
          {PLATFORM_NAME}
        </HeaderName>
      ) : (
        <>
          <HeaderName href="/" prefix="IBM" as={Link}>
            {PLATFORM_NAME}
          </HeaderName>
          <HeaderGlobalBar>
            <HeaderGlobalAction aria-label="Help">
              <Help size={20} />
            </HeaderGlobalAction>
          </HeaderGlobalBar>
        </>
      )}
    </Header>
  )
}

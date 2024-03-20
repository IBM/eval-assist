import { useEffect, useState } from 'react'
import { useMediaQuery } from 'react-responsive'

import { appWithTranslation } from 'next-i18next'
import type { AppProps } from 'next/app'
import Head from 'next/head'

import { CircleFilled } from '@carbon/icons-react'
import { Content, Header, HeaderGlobalAction, HeaderGlobalBar, HeaderName, Theme } from '@carbon/react'
import '@styles/globals.scss'
import ThemePreference from '@theme'

import { PLATFORM_NAME } from '@constants'

function App({ Component, pageProps }: AppProps) {
  const sm = useMediaQuery({ query: '(max-width: 671px)' })
  const title = `${PLATFORM_NAME}`

  const [backendOk, setBackendOk] = useState(false)
  const getBackendStatus = async () => {
    const response = await fetch('/api/health', {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
    }).then((r) => {
      setBackendOk(r.ok)
    })
  }

  useEffect(() => {
    getBackendStatus()
  })

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png" />
        <meta name="apple-mobile-web-app-title" content={title} />
        <meta name="application-name" content={title} />
        <meta name="msapplication-TileColor" content="#052fad" />
        <meta name="theme-color" content="#161616" />
      </Head>
      <ThemePreference>
        <Theme theme="g100">
          <Header aria-label={title}>
            {sm ? (
              <HeaderName href="/" prefix="">
                {PLATFORM_NAME}
              </HeaderName>
            ) : (
              <>
                <HeaderName href="/" prefix="">
                  EvaluLLM
                </HeaderName>
                <HeaderGlobalBar>
                  <HeaderGlobalAction
                    aria-label="Backend"
                    onClick={() => {
                      getBackendStatus()
                    }}
                  >
                    {backendOk && <CircleFilled size={20} style={{ fill: 'green' }}></CircleFilled>}
                    {!backendOk && <CircleFilled size={20} style={{ fill: 'gray' }}></CircleFilled>}
                  </HeaderGlobalAction>
                </HeaderGlobalBar>
              </>
            )}
          </Header>
        </Theme>
        <Content>
          <Component {...pageProps} />
        </Content>
      </ThemePreference>
    </>
  )
}

export default appWithTranslation(App)

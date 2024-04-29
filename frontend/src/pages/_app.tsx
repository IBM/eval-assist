import type { AppProps } from 'next/app'
import Head from 'next/head'

import { Content, Theme } from '@carbon/react'
import '@styles/globals.scss'
import ThemePreference from '@theme'

import { AppHeader } from '@components/AppHeader/AppHeader'
import { RouterLoading } from '@components/RouterLoading/RouterLoading'
import { PLATFORM_NAME } from '@constants'

const App = ({ Component, pageProps }: AppProps) => {
  const title = `IBM ${PLATFORM_NAME}`

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="" />
        <link rel="shortcut icon" href="/images/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png" />
        <meta name="apple-mobile-web-app-title" content={title} />
        <meta name="application-name" content={title} />
        <meta name="msapplication-TileColor" content="#052fad" />
        <meta name="theme-color" content="#161616" />
      </Head>
      <ThemePreference>
        <>
          <RouterLoading />
          {/* <AppHeader /> */}
          <Component {...pageProps} />
        </>
      </ThemePreference>
    </>
  )
}

export default App

import { PLATFORM_NAME } from 'src/constants'

import type { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import type { AppProps } from 'next/app'
import Head from 'next/head'

import '@styles/globals.scss'

import { AppShell } from '@components/AppShell/AppShell'

const App = ({ Component, pageProps: { session, ...pageProps } }: AppProps<{ session: Session }>) => {
  const title = `${PLATFORM_NAME}`
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="" />
        <link rel="icon" href="/logo.svg" />
        <meta name="apple-mobile-web-app-title" content={title} />
        <meta name="application-name" content={title} />
        <meta name="msapplication-TileColor" content="#052fad" />
        <meta name="theme-color" content="#161616" />
      </Head>
      <SessionProvider session={session}>
        <AppShell>
          <Component {...pageProps} />
        </AppShell>
      </SessionProvider>
    </>
  )
}

export default App

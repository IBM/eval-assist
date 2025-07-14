import type { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import type { AppProps } from 'next/app'
import Head from 'next/head'

import '@styles/globals.scss'

import { AppShell } from '@components/AppShell/AppShell'
import { FeatureFlagsProvider } from '@providers/FeatureFlagsProvider'

const App = ({ Component, pageProps: { session, ...pageProps } }: AppProps<{ session: Session }>) => {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>EvalAssist</title>
        <meta
          name="description"
          content="EvalAssist is an application that simplifies using large language models as evaluators (LLM-as-a-Judge) of the output of other large language models."
        />
        <meta property="og:title" content="EvalAssist" />
        <meta
          property="og:description"
          content="EvalAssist simplifies LLM-as-a-Judge by supporting users in iteratively refining evaluation criteria in a web-based user experience."
        />
        <meta property="og:url" content="https://ibm.github.io/eval-assist/" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image" content="https://ibm.github.io/eval-assist/images/EvalAssistPreview.jpg" />
        <meta property="og:image:secure_url" content="https://ibm.github.io/eval-assist/images/EvalAssistPreview.jpg" />
        <meta property="og:image:alt" content="EvalAssist logo" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />

        <meta name="keywords" content="LLM-as-a-Judge, EvalAssist, AI evaluation, large language models" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/images/icon-32x32.png" type="image/png" />
        <link rel="icon" href="/images/icon.svg" type="image/svg+xml" />
      </Head>
      <FeatureFlagsProvider>
        <SessionProvider session={session}>
          <AppShell>
            <Component {...pageProps} />
          </AppShell>
        </SessionProvider>
      </FeatureFlagsProvider>
    </>
  )
}

export default App

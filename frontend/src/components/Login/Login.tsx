import { signIn } from 'next-auth/react'
import Head from 'next/head'

import { Button } from '@carbon/react'

import styles from '../../styles/Login.module.scss'

export const LoginView = () => {
  return (
    <main className={styles.main}>
      <Head>
        <title>IBM Research EvalAssist</title>
        <meta name="description" content="Prompt Assistant experience powered by BAM" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/favicon.ico" />
      </Head>
      <div className={styles.page}>
        <h1 className={styles.title}>
          Log in to <br /> EvalAssist
        </h1>
        <div className={styles.authContainer}>
          <Button onClick={() => signIn('IBMid')}>Log in</Button>
        </div>
      </div>
    </main>
  )
}

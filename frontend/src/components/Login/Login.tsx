import { signIn } from 'next-auth/react'

import { Button } from '@carbon/react'

import styles from './Login.module.scss'

export const LoginView = () => {
  return (
    <div className={styles.root}>
      <h1 className={styles.title}>
        Log in to <br /> EvalAssist
      </h1>
      <div className={styles.authContainer}>
        <Button onClick={() => signIn('IBMid')}>Log in</Button>
      </div>
    </div>
  )
}

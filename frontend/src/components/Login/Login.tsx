import { signIn } from 'next-auth/react'
import Image from 'next/image'

import { Button } from '@carbon/react'

import styles from './Login.module.scss'

export const LoginView = () => {
  return (
    <div className={styles.root}>
      <Image src="/images/icon.svg" alt="EvalAssist Logo" width={100} height={100} />
      <h1 className={styles.title}>
        Log in to <br /> EvalAssist
      </h1>

      <div className={styles.authContainer}>
        <Button onClick={() => signIn('IBMid')}>Log in with IBMid</Button>
      </div>
    </div>
  )
}

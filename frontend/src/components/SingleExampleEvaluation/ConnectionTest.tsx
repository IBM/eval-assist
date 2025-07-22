import { Link } from '@carbon/react'
import { Checkmark, ConnectionSignal, MisuseOutline } from '@carbon/react/icons'

import { useTestModelConnection } from '@customHooks/useTestModelConnection'
import { Evaluator } from '@types'

import classes from './ConnectionTest.module.scss'

interface Props {
  model: Evaluator | null
}

export const ConnectionTest = ({ model }: Props) => {
  const { testModelConnection, testingModelConnection, showingTestingModelConnectionSuccess, modelConnectionStatus } =
    useTestModelConnection({ model })

  return !testingModelConnection && !showingTestingModelConnectionSuccess ? (
    <Link disabled={!model} style={{ cursor: 'pointer' }} renderIcon={ConnectionSignal} onClick={testModelConnection}>
      {'Test connection'}
    </Link>
  ) : testingModelConnection ? (
    <p className={classes.connectionTestingFont}>{'Testing model connection...'}</p>
  ) : showingTestingModelConnectionSuccess ? (
    <div className={classes.successConnectionContainer}>
      {modelConnectionStatus == 'success' ? (
        <>
          <p className={classes.connectionTestingFont}>{'Model connection test succeeded'}</p>
          <Checkmark className={classes.successLogo} />
        </>
      ) : (
        <>
          <p className={classes.connectionTestingFont}>{'Model connection test failed'}</p>
          <MisuseOutline className={classes.failureLogo} />
        </>
      )}
    </div>
  ) : null
}

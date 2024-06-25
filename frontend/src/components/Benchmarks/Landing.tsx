import cx from 'classnames'

import { BenchmarkSidenav } from './Sidenav'
import classes from './index.module.scss'

export const Landing = () => {
  return (
    <>
      <BenchmarkSidenav />
      <div className={cx(classes.root, classes.leftPadding)}>
        <h3 className={cx(classes.title, classes.bottomDivider)}>Benchmarks</h3>
        <p style={{ fontStyle: 'italic' }}>Click on a benchmark in the sidebar panel to see its content.</p>
      </div>
    </>
  )
}

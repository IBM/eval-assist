import { Content, Link } from '@carbon/react'

import { AppHeader } from '@components/AppHeader/AppHeader'
import { withAuth } from '@components/HOC/withAuth'

import classes from './Documentation.module.scss'

const Documentation = () => {
  return (
    <Content>
      <article className={classes['documentation']}>
        <h3 style={{ marginBottom: '1rem' }}>EvalAssist & LLM-as-a-judge</h3>
        <hr className={classes['horizontal-divider']} />
        <h2>Overview</h2>
        <p>
          <strong>EvalAssist</strong> is a development environment for LLM-as-a-judge evaluation criteria. We currently
          support rubric style criteria where the evaluation is described in terms of a question and a set of predefined
          answers.
        </p>
        <h2>Context, response & criteria</h2>
        <p>
          LLM-as-a-judge evaluations are comprised of an <strong>input context</strong>, a{' '}
          <strong>response to evaluate </strong>
          and a <strong>criteria definition</strong>. The input context provides contextual information to the LLM
          judge, this could be a question in a Q/A evaluation scenario, or a reference document and a question in a RAG
          Q/A scenario. The response to evaluate is the text that we want the LLM to evaluate, subject to the input
          context. Finally the criteria describes the details of the evaluation itself.
        </p>
        <h2>Exporting criteria & evaluating larger datasets</h2>
        <p>
          You can export criteria from EvalAssist in json format by selecting the JSON tab on the evaluation criteria
          and copying the json data. We provide a standalone LLM-as-a-judge library that you can use to apply criteria
          developed in EvalAssist to larger datasets.
          <br />
          <br />
          <Link href="https://github.ibm.com/AIExperience/llm-as-a-judge">
            https://github.ibm.com/AIExperience/llm-as-a-judge
          </Link>
        </p>
      </article>
    </Content>
  )
}

export default withAuth(Documentation)

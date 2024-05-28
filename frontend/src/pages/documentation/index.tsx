import Image from 'next/image'

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
          support <strong>direct assessment</strong> where evaluation is described in terms of a question (or statement)
          and a set of predefined answers, and <strong>pairwise comparison</strong> where the evaluation involves
          selecting the best response from a pair of possible responses. The tool also provides a catalog of example
          test cases, exhibiting the use of LLM-as-a-judge across a variety of scenarios.
        </p>
        <h2>Get API Key</h2>
        <p>
          You need a BAM api key to use the tool, you can obtain and copy your API key from{' '}
          <Link href="https://bam.res.ibm.com/">https://bam.res.ibm.com/</Link> under the documentation section (see
          highlighted portion below)
          <br />
          <br />
          <Image
            src="/images/api_key_help.png"
            alt="Image describing location of API key on BAM page"
            width="642"
            height="385"
          />
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
        <h2>Sponsor Users</h2>
        <p>
          We are deeply grateful to the sponsored users listed below, whose invaluable feedback has greatly contributed
          to refining and enhancing our tools.
          <br /> <br />
          Top contributors (in alphabetical order): Andrew R. Freed, Andre Lopes, Bill Murdock, Charley Beller, Connie
          He, Davidson Siga, Huaiyu Zhu, Michael Choie, Shobhi Varshney, Sonali Rajendra, Yannis Katsis
          <br /> <br />
          If you&apos;re interested in becoming part of our sponsored user program and engaging in our user study to
          test our tool and offer feedback,{' '}
          <Link href="https://airtable.com/appBlXR5AJ5v3dHDN/shrtDukPTBiP7VjJd">please fill out this form</Link>. Your
          input is pivotal in our continuous efforts to enhance our tool, making it more impactful and generating
          valuable insights for publication.
        </p>
      </article>
    </Content>
  )
}

export default withAuth(Documentation)

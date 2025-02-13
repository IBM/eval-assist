import { useEffect } from 'react'

import Image from 'next/image'

import { Content, Link, ListItem, UnorderedList } from '@carbon/react'

import { withAuth } from '@components/HOC/withAuth'

import classes from './Documentation.module.scss'

const Documentation = () => {
  useEffect(() => {
    const scrollToHashElement = () => {
      const { hash } = window.location
      const elementToScroll = document.getElementById(hash?.replace('#', ''))

      if (!elementToScroll) return

      window.scrollTo({
        top: elementToScroll.offsetTop - 50,
        behavior: 'smooth',
      })
    }

    scrollToHashElement()
    window.addEventListener('hashchange', scrollToHashElement)
    return window.removeEventListener('hashchange', scrollToHashElement)
  }, [])

  return (
    <>
      <Content>
        <article className={classes['documentation']}>
          <h3 style={{ marginBottom: '1rem' }}>EvalAssist & LLM-as-a-judge</h3>
          <hr className={classes['horizontal-divider']} />
          <h2>Overview</h2>
          <p>
            <strong>EvalAssist</strong> is a development environment for LLM-as-a-judge evaluation criteria. We
            currently support <strong>direct assessment</strong> where evaluation is described in terms of a question
            (or statement) and a set of predefined answers, and <strong>pairwise comparison</strong> where the
            evaluation involves selecting the best response from a pair of possible responses. The tool also provides a
            catalog of example test cases, exhibiting the use of LLM-as-a-judge across a variety of scenarios.
          </p>
          <h2>Get your API Key</h2>
          <p>
            You need a BAM api key to use the tool, you can obtain and copy your API key from{' '}
            <Link href="https://bam.res.ibm.com/">https://bam.res.ibm.com/</Link> under the documentation section (see
            highlighted portion below)
            <br />
            <br />
            <Image
              style={{ border: '1px solid gray' }}
              src="/images/api_key_help.png"
              alt="Image describing location of API key on BAM page"
              width="550"
              height="355"
            />
          </p>
          <h2>Terminology</h2>
          <p>
            LLM-as-a-judge evaluations are comprised of a <strong>context</strong>, a{' '}
            <strong>response to evaluate </strong>
            and a <strong>criteria definition</strong>. The context provides contextual information to the LLM judge:
            this could be a prompt, a question in a Q/A evaluation scenario, or a reference document and a question in a
            RAG Q/A scenario. The response to evaluate is the text that we want the LLM to evaluate, subject to the
            context. Finally the criteria describes the details of the evaluation itself.
          </p>
          <h2>Direct Assessment</h2>
          <p>
            Direct assessment is an evaluation paradigmn wherein the LLM chooses one of a set of predefined values from
            an evaluation rubric. This approach can be used to perform likert scale scoring of responses (e.g 1-5) or
            assign from a set of semantically conditioned literals (Yes/No, Pass/Fail) etc. Direct assessment criteria
            comprise of a name, a criteria expression (typically a short statement or question) and a set of predefined
            options with descriptions.
          </p>
          <h2>Pairwise Comparison</h2>
          <p>
            Pairwise Comparison is an evaluation paradigm wherein the LLM chooses a preferred response from a pair of
            candidate responses. Exactly two responses are required to run a pairwise comparison in the sandbox.
            Pairwise Comparison criteria are simpler, requiring only a name and a criteria description.
          </p>

          <h2 id="evaluators">Evaluators</h2>
          <p>
            The sandbox supports the set of LLM evaluators implemented in the{' '}
            <Link href="https://github.ibm.com/AIExperience/llm-as-a-judge">llm-as-a-judge</Link> toolkit. The current
            set of supported evaluators:
          </p>

          <UnorderedList>
            <ListItem>
              <strong>mistralai/mixtral-8x7b-instruct-v01</strong>
            </ListItem>
            <ListItem>
              <strong>meta-llama/llama-3-8b-instruct</strong>
            </ListItem>
            <ListItem>
              <strong>meta-llama/llama-3-70b-instruct</strong>
            </ListItem>
            <ListItem>
              <strong>kaist-ai/prometheus-8x7b-v2</strong>
            </ListItem>
          </UnorderedList>
          <br />
          <br />
          <p>
            Evaluation is implemented using a variety of prompting strategies and analysis of log probabilities of
            predefined scoring options. At a high level the LLM is first asked to generate an assessment of the response
            subject to the context and the evaluation criteria. The LLM is then given each of the possible outcomes of
            the evaluation, and the likelihood of each outcome is calculated via token log probabilities. Finally the
            assessment is summarized to produce an explanation, and the most likley scoring outcome is selected. We also
            calculate meta evaluation metrics such as positional bias, to determine how robust is the overall evaluation
            results. Note that the implementation of the <strong>kaist-ai/prometheus-8x7b-v2</strong> evaluator is
            different because this LLM is finetuned to produce structured output.
            <br />
            <br />
            Please refer to{' '}
            <Link href="https://bam.res.ibm.com/docs/models#" target="_blank" rel="noopener noreferrer">
              BAM documentation
            </Link>{' '}
            for guidance on model usage in your context.
          </p>

          <h2 id="positional-bias">Positional Bias</h2>
          <p>
            Our evaluators are capable of detecting positional bias. Positional bias occurs when the LLM evaluator is
            unable to consistently make an evalutaion decision when presented with a set of possible options. This can
            be detected by changing the order of options presented to the LLM, re-running the evaluation and looking for
            consistency in the result. Results that exhibit positional bias are uncertain and cannot be trusted. You may
            see sandbox evaluation results in red, indicating that positional bias has been detected.
          </p>

          <h2 id="certainty">Certainty</h2>
          <p>
            We also attempt to determine the certainty of evaluator judgements, which can help to determine the quality
            of an outcome. Certainty is calculated by taking the average probability of the tokens corresponding to a
            particular judgement. The certainty score is presented in the sandbox UI as a percentage.
          </p>

          <h2>Tips</h2>
          <p>
            Refer to the <strong>response</strong> and any appropriate context variable(s) in your criteria description.
            For instance: <strong>&quot;Is the response coherent with respect to the source document?&quot;</strong>{' '}
            This helps the LLM to attend to the correct information when making a scoring decision.
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
            We are deeply grateful to the sponsored users listed below, whose invaluable feedback has greatly
            contributed to refining and enhancing our tools.
            <br /> <br />
            Top contributors (in alphabetical order): Andrew R. Freed, Andre Lopes, Bill Murdock, Charley Beller, Connie
            He, Davidson Siga, Huaiyu Zhu, Michael Choie, Shobhi Varshney, Sonali Rajendra, Yannis Katsis.
            <br /> <br />
            If you&apos;re interested in becoming part of our sponsored user program and engaging in our user study to
            test our tool and offer feedback,{' '}
            <Link href="https://airtable.com/appBlXR5AJ5v3dHDN/shrtDukPTBiP7VjJd">please fill out this form</Link>. Your
            input is pivotal in our continuous efforts to enhance our tool, making it more impactful and generating
            valuable insights for publication.
          </p>
        </article>
      </Content>
    </>
  )
}

export default withAuth(Documentation)

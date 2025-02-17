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
          <h1 style={{ marginBottom: '1rem' }}>Intro to EvalAssist</h1>
          <hr className={classes['horizontal-divider']} />
          <h2>Overview</h2>
          <p>
            <strong>EvalAssist</strong> is an LLM-as-a-Judge framework built on top of the{' '}
            <Link
              href="https://www.unitxt.ai/en/latest/docs/introduction.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              UNITXT
            </Link>{' '}
            open source evaluation library for large language models. The EvalAssist application provides users with a
            convenient way of iteratively testing and refining LLM-as-a-judge criteria, and supports both direct
            (rubric-based) and pairwise assessment paradigms (relation-based), the two most prevalent forms of
            LLM-as-a-judge evaluations available. EvalAssist is designed to be model-agnostic, i.e. the content to be
            evaluated can come from any model. EvalAssist supports a rich set of off-the-shelf judge models that can
            easily be extended. An API key is required to use the pre-defined judge models. Once users are satisfied
            with their criteria, they can auto-generate a Notebook with UNITXT code to run bulk evaluations with larger
            data sets based on their criteria definition. EvalAssist also includes a catalog of example test cases,
            exhibiting the use of LLM-as-a-judge across a variety of scenarios. Users can save their own test cases.
          </p>

          <h3>Direct Assessment</h3>
          <p>
            Direct assessment is an evaluation paradigmn wherein the LLM chooses one of a set of predefined values from
            an evaluation rubric. This approach can be used to perform likert scale scoring of responses (e.g 1-5) or
            assign from a set of semantically conditioned literals (Yes/No, Pass/Fail) etc. Direct assessment criteria
            comprise of a name, a criteria expression (typically a short statement or question) and a set of predefined
            options with descriptions.
          </p>

          <h3>Pairwise Comparison</h3>
          <p>
            Pairwise Comparison is an evaluation paradigm wherein the LLM chooses a preferred response from a pair of
            candidate responses. Exactly two responses are required to run a pairwise comparison in the sandbox.
            Pairwise Comparison criteria are simpler, requiring only a name and a criteria description. In EvalAssist,
            pairwise comparisons are conducted across more than two data points by computing a win rate and ranking the
            outputs accordingly.
          </p>

          <h2>Using EvalAssist</h2>
          <h3>API Keys</h3>
          <p>
            You need at least one API key to use EvalAssist. We support multiple LLM service providers such as WatsonX,
            RITS (IBM Research Internal), Open AI, and Azure Open AI. You can enter an API key in the API Credentials
            drop-down in the evaluation form. The screenshot below shows you a test case for &quot;Conciseness&quot;
            Example Catalog.
            <br />
            <br />
            <Image
              style={{ border: '1px solid gray' }}
              src="/images/Credentials.png"
              alt="Image describing location of API key on BAM page"
              width="800"
              height="400"
            />
          </p>
          <h3>Running Evaluations</h3>
          <p>
            To run LLM-as-a-judge evaluations in EvalAssist, you will need to provide at a minimum the text to evaluate,
            a definition of a criteria, and your choice of an evaluator LLM. These three mandatory elements and others
            can be entered, when you create a new test case in EValAsist (Evaluation Sandbox):
          </p>

          <UnorderedList>
            <ListItem>
              <strong>Task Context (optional):</strong> The task context provides additional information that may be
              relevant and needed for the evaluation. This could be, for example, a prompt, a question in a Q/A
              evaluation scenario, a reference document, or a question in a RAG Q/A scenario. You can create multiple
              variables to describe this information and refer to them in your criteria definition.
            </ListItem>
            <br />
            <ListItem>
              <strong>Evaluation Criteria:</strong>Enter the title and a description of your criteria. For Direct
              Assessment, you will also need to add options that the LLM can choose from. Each option can also be
              described in detail which sometimes may make it easier for an LLM to differentiate. The description is
              optional though. For pairwise comparison, you will only have to provide a criteria which can be used to
              compare two or more test data items.
            </ListItem>
            <br />
            <ListItem>
              <strong>Evaluator:</strong>Choose an evaluator LLM from the list of available providers.
            </ListItem>
            <br />
            <ListItem>
              <strong>Test Data:</strong>In the test data section, enter the text you would like to evaluate according
              the the criteria you defined and the context variables provided. The text to evaluate will often the same
              as the output of an LLM (response) you want to evluate. Hence, the default name of this variable is called
              response. Depending on your use case, you may want to change the name of the variable so you can properly
              refer to it in your criteria description. The text to evaluate could be anything though and doesn&apos;t
              necessarily have to come from another LLM. If you are adding a lot of test data points, it maybe helpful
              to addan expected rating (or ranking in case of pairwise comparison) so you can see at a glance, which
              test data points were evaluated correctly (according to your definition).
            </ListItem>
          </UnorderedList>
          <br />
          <br />
          <p>
            Once you are satisfied with your criteria and test case, you can save it into your personal test case
            library.
          </p>

          <h3>Bulk Evaluations</h3>
          <p>
            The sandbox supports iterating over a single criterion with multiple outputs to be evaluated and a single
            task context for all outputs. Once you are ready to evaluate larger data sets with diverse contexts, you can
            download a Jupyter Notebook with code auto-generated for use with UNITXT, or you can just simply use Python
            directly based on the Notebook code to run your evaluation.
          </p>
          <Image
            style={{ border: '1px solid gray' }}
            src="/images/Download Jupyter Notebook.png"
            alt="Image describing location of API key on BAM page"
            width="450"
            height="200"
          />
          <br />
          <br />
          <h3 id="positional-bias">Positional Bias</h3>
          <p>
            Our evaluators are capable of detecting positional bias. Positional bias occurs when the LLM evaluator is
            unable to consistently make an evalutaion decision when presented with a set of possible options. Results
            that exhibit positional bias are uncertain and cannot be trusted. You may see sandbox evaluation results in
            red, indicating that positional bias has been detected.
          </p>
          <h3>Tips</h3>
          <p>
            Refer to the <strong>response</strong> and any appropriate context variable(s) in your criteria description.
            For instance: <strong>&quot;Is the response coherent with respect to the source document?&quot;</strong>{' '}
            This helps the evaluator LLM to attend to the correct information when making a scoring decision.
          </p>

          <h2>Evaluation Methodology</h2>
          <p>
            Evaluation is implemented using a prompt chaining strategy as depicted below. The evaluator LLM is first
            asked to generate an assessment of the response subject to the context and the evaluation criteria. In a
            second step the evluator LLM is asked to generate an explanation based on the assessment for each of the
            options. In the last step, the evaluator LLM is prompted to make a final choice based on the assessment and
            the options available. As part of this process, we also calculate meta evaluation metrics such as positional
            bias, to determine how robust is the overall evaluation is. This is detected by changing the order of
            options presented to the evaluator LLM, re-running the evaluation and looking for consistency in the result.
          </p>

          <Image
            style={{ border: '1px solid gray' }}
            src="/images/Evaluation Methodology.png"
            alt="Image describing location of API key on BAM page"
            width="800"
            height="650"
          />
        </article>
      </Content>
    </>
  )
}

export default withAuth(Documentation)

# EvalAssist

<p align="center">
  <img src="frontend/public/images/logo.svg" alt="EvalAssist Logo" width="200"/>
</p>

<p align="center">
  <a href="https://ibm.github.io/eval-assist/">Project Website</a> •
  <a href="https://github.com/IBM/eval-assist/wiki">Documentation</a> •
  <a href="https://www.youtube.com/watch?v=bTf0N1GGslE">Video demo</a>
</p>

<!-- Build Status, is a great thing to have at the top of your repository, it shows that you take your CI/CD as first class citizens -->
<!-- [![Build Status](https://travis-ci.org/jjasghar/ibm-cloud-cli.svg?branch=master)](https://travis-ci.org/jjasghar/ibm-cloud-cli) -->

<!-- Not always needed, but a scope helps the user understand in a short sentance like below, why this repo exists -->

EvalAssist is an LLM-as-a-Judge framework built on top of the [Unitxt](https://www.unitxt.ai/en/latest/docs/introduction.html)
open source evaluation library for large language models. The EvalAssist application provides users with a
convenient way of iteratively testing and refining LLM-as-a-judge criteria, and supports both direct
(rubric-based) and pairwise assessment paradigms (relation-based), the two most prevalent forms of
LLM-as-a-judge evaluations available. EvalAssist is designed to be model-agnostic, i.e. the content to be
evaluated can come from any model. EvalAssist supports a rich set of off-the-shelf judge models that can
easily be extended. An API key is required to use the pre-defined judge models. Once users are satisfied
with their criteria, they can auto-generate a Notebook with Unitxt code to run bulk evaluations with larger
data sets based on their criteria definition. EvalAssist also includes a catalog of example test cases,
exhibiting the use of LLM-as-a-judge across a variety of scenarios. Users can save their own test cases.

## How to Install 🚀

### Installation via Python pip 🐍

EvalAssist can be installed using pip, the Python package installer. Before proceeding, ensure you're using **Python >= 3.10, <3.14** to avoid compatibility issues.

1. **Install EvalAssist**:
   Open your terminal and run the following command to install EvalAssist:

   ```bash
   pip install evalassist
   ```

    _Note: It is recommended to install EvalAssist in an isolated Python environment using a tool like venv or conda._

2. **Running EvalAssist**:
   After installation, you can start EvalAssist by executing:

   ```bash
   eval-assist serve
   ```

This will start the EvalAssist server, which you can access at [http://localhost:8000](http://localhost:8000)

_Check out the tutorials to see how to [run evaluations](https://github.com/IBM/eval-assist/wiki#mini-tutorial-running-an-evaluation) and [generate synthetic data](https://github.com/IBM/eval-assist/wiki#mini-tutorial-generating-test-data)._

## Contributing

You can contribute to EvalAssist or to Unitxt. Look at the [Contribution Guidelines](https://github.com/IBM/eval-assist/blob/main/CONTRIBUTING.md) for more details.

Look at the [Local Development Guide](https://github.com/IBM/eval-assist/blob/main/LOCAL_DEV_GUIDE.md) for instructions on setting up a local development environment.

## Documentation

You can find extesive documentation of the system in the [Documentation page](https://github.com/IBM/eval-assist/wiki).

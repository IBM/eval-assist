## Contributing In General
Our project welcomes external contributions. If you have an itch, please feel
free to scratch it.

To contribute code or documentation, please submit a [pull request](https://github.com/ibm/eval-assist/pulls).

A good way to familiarize yourself with the codebase and contribution process is
to look for and tackle low-hanging fruit in the [issue tracker](https://github.com/ibm/eval-assist/issues).

**Note: We appreciate your effort, and want to avoid a situation where a contribution
requires extensive rework (by you or by us), sits in backlog for a long time, or
cannot be accepted at all!**

### Proposing new features

If you would like to implement a new feature, please [raise an issue](https://github.com/ibm/eval-assist/issues)
before sending a pull request so the feature can be discussed. This is to avoid
you wasting your valuable time working on a feature that the project developers
are not interested in accepting into the code base.

### Fixing bugs

If you would like to fix a bug, please **FIXME** [raise an issue](https://github.com/ibm/eval-assist/issues) before sending a
pull request so it can be tracked.

### Merge approval

The project maintainers use LGTM (Looks Good To Me) in comments on the code
review to indicate acceptance.

For a list of the maintainers, see the [MAINTAINERS.md](MAINTAINERS.md) page.

## Legal

We have tried to make it as easy as possible to make contributions. This
applies to how we handle the legal aspects of contribution. We use the
same approach - the [Developer's Certificate of Origin 1.1 (DCO)](https://github.com/hyperledger/fabric/blob/master/docs/source/DCO1.1.txt) - that the Linux® Kernel [community](https://elinux.org/Developer_Certificate_Of_Origin)
uses to manage code contributions.

We simply ask that when submitting a patch for review, the developer
must include a sign-off statement in the commit message.

Here is an example Signed-off-by line, which indicates that the
submitter accepts the DCO:

```bash
Signed-off-by: John Doe <john.doe@example.com>
```

You can include this automatically when you commit a change to your
local git repository using the following command:

```bash
git commit -s
```

## Communication

Please feel free to connect with us through issues and pull requests on this repository.

## Setup

Please see the [README](README.md) for setup instructions.

## Testing

Testing is not available at this time.

## Contributing To Unitxt

EvalAssist relies heavily on [Unitxt](https://www.unitxt.ai/en/latest/), a Python library designed for flexible and reusable data preparation and evaluation for generative AI models. EvalAssist's LLM-as-a-Judge evaluator are part of the Unitxt sourcode. To enhance the broader community and promote interoperability, we encourage you to contribute your evaluation criteria and related components to Unitxt.

## How to contribute criteria to Unitxt

### Contribute creating an issue

The most straightforward way to add a new criterion to Unitxt is to [create an issue](https://github.com/IBM/unitxt/issues/new) and filling it with the required information. In the issue's body, copy and past your criteria from EvalAssist -you can copy/paste the json format in the JSON tab in the Evaluation criteria section-. For example:

```json
{
    "name": "Temperature in celsius and fahrenheit",
    "description": "In the response, if there is a numerical temperature present, is it denominated in both Fahrenheit and Celsius?",
    "options": [
        {
            "name": "Yes",
            "description": "The temperature reading is provided in both Fahrenheit and Celsius."
        },
        {
            "name": "No",
            "description": "The temperature reading is provided either in Fahrenheit or Celsius, but not both."
        },
        {
            "name": "Pass",
            "description": "There is no numerical temperature reading in the response."
        }
    ]
}
```

In the issue, you should also add context around when this criteria should be used, which context variables was it used with and what is the name of the response variable. In addition, add a mapping between the option names and numerical values. Unitxt uses numerical values to compute metrics like Pearson correlation when benchmarking evaluators on specific criteria. For example:

```text
Context variables: []
Response variable: response
Option map: {"Yes": 1.0, "No": 0.5, "Pass": 0.0}
```

### Contribute creating a PR

If you are familiarize with Unitxt ecosystem. You can perform the following steps:
1. Find the `DirectCriteriaCatalogEnum` or `PairwiseCriteriaCatalogEnum` enum in the [llm_as_judge_constants.py](https://github.com/IBM/unitxt/blob/main/src/unitxt/llm_as_judge_constants.py) file -depending on wether you want to contribute a direct or pairwise criteria-.
2. Create your criteria object (using either `CriteriaWithOptions` or `Criteria`).
3. Run the [prepare file](https://github.com/IBM/unitxt/blob/main/prepare/metrics/llm_as_judge/llm_as_judge.py) to create the criteria's artifact.

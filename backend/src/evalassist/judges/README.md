# EvalAssist Judges package

## Overview

The judges module is the core component of the EvalAssist project, designed to evaluate instances against a set of criteria. It provides a flexible framework for different types of evaluations, including direct and pairwise assessments.

To use this package, you will have to install evalassist first (e.g. `pip install evalassist` or your installation method of preference). Then, you can import any judge from `evalassist.judges`. For example: `from evalassist.judges import DirectJudge`.

## Key Components

### The Criteria and the Instance

The `Judge`,`Criteria` and `Instance` are the basic blocks of an evaluation. The judge evalautes an instance based on a criteria. The criteria decides how the fields that the instance holds are going to be used. There are two types of fields, context fields and the field to be evaluated. As the role of each field may differ for different criteria, it is the criteria itself who define the role of each field. So, the instance's `fields` attribute defines all the fields, while the criteria's `to_evaluate_field` and `context_fields` define each field's role. As an example, let's say you are using LLM as a Judge to evaluate RAG pipelines. You may have criteria like Context Relevance and Groudedness. Your instances will hold fields like `user_message`, `assistance_response` and `documents`. In this scenario, Context Relevance will define the `documents` field as the `to_evaluate_field`, while, the Groudedness criteria will define `assistant_response` as the `to_evaluate_field`. Same instance fields and values, different roles.

### Types

The module defines several key types in [`types.py`](./types.py):

* `Instance`: Abstract base class for evaluation instances.
* `DirectInstance` and `PairwiseInstance`: Concrete subclasses for direct and pairwise evaluations.
* `Criteria` and `CriteriaOption`: Classes representing evaluation criteria and their options.
* `DirectInstanceResult` and `PairwiseInstanceResult`: Classes for storing evaluation results.
* `MultiCriteria` and `MultiCriteriaItem`: Classes for defining and evaluating multiple criteria simultaneously on direct assessment evaluation.
* `MultiCriteriaItemResult`: Class for storing results of multi-criteria item direct evaluation.
* `MultiCriteriaDirectInstanceResult`: Class for storing results of multi-criteria direct evaluations.

### Base Classes

The `base.py` file contains abstract base classes for judges:

* `Judge`: The main abstract base class for all judges.
* `BaseDirectJudge` and `BasePairwiseJudge`: Abstract subclasses for direct and pairwise evaluation judges.

## Contributing a judge implementation

To create a custom judge, you can subclass `BaseDirectJudge` or `BasePairwiseJudge` and implement the `_run()` methods. This method is in charge of evaluating a list of instances on a list a criteria. The parent methods `evaluate()` and `_evaluate()` take care of adjusting the criteria and replicating the instances as needed based on the `check_positional_bias` and `self_consistency` values.

## Evaluation Process

The evaluation process involves:

1. Creating an instance of a judge with appropriate configuration.
2. Preparing evaluation instances and criteria.
3. Calling the judge instance with the prepared instances and criteria.
4. Processing the evaluation results.

## Results

Evaluation results content vary between direct, pairwise and multiple criteria evaluations.

* **Direct single criteria result** (DirectInstanceResult): contains information such as the selected option, score, explanation, feedback, positional bias and metadata (depends on the Judge, e.g. the prompt used).
* **Pairwise single criteria result** (PairwiseInstanceResult): Contains both gloabal and detailed information of the contests of the different compared responses: contest results, compared to, explanations, positional bias, certainty, winrate, ranking, selections
* **Direct multiple criteria result** (MultiCriteriaDirectInstanceResult): contains the aggregated score (between 0.0 and 1.0) even if the single criteria doesn't have a numeric score, per criterion score (the numeric score per criterion once weight was applied) and the single criteria results for each instance.
* **Pairwise multiple criteria result**: not implemented yet.

## Single criteria evaluation

The `evaluate` method of judges is flexible and can be called with simplified parameters. For instance, the `instances` parameter can be a list of strings or `DirectInstance` objects, and the `criteria` parameter can be a string (which will be translated into account as a yes/no criteria) or a `Criteria` object.

### Example Usage

The `backend/examples/run_judge.py` file demonstrates how to use the `BaseDirectJudge` class:

```python
from evalassist.judges import BaseDirectJudge
from evalassist.judges.const import DEFAULT_JUDGE_INFERENCE_PARAMS
from unitxt.inference import CrossProviderInferenceEngine

judge = DirectJudge(
    inference_engine=CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        **DEFAULT_JUDGE_INFERENCE_PARAMS,
    ),
    generate_feedback=True,
)

results = judge(
    instances=[
        "Use the API client to fetch data from the server and the cache to store frequently accessed results for faster performance."
    ],
    criteria="Is the text self-explanatory and self-contained?",
)

print("### Selected option / Score")
print(f"{results[0].option} / {results[0].score}")
print("\n### Explanation")
print(results[0].explanation)
print("\n### Feedback")
print(results[0].feedback)
```

## Multi-Criteria Evaluation

The judges module also supports evaluating instances against multiple criteria simultaneously. This is achieved using the `MultiCriteria` class, which allows you to define a list of `MultiCriteriaItem` objects. Each `MultiCriteriaItem` represents a criterion along with its weight, target option, score threshold, and other configuration options.

**Note:** Multi-criteria evaluation is currently only available for direct judges.

When configuring `MultiCriteria`, you have several options to adjust how the aggregated score is calculated:

* `weight`: The weight assigned to each criterion in the overall evaluation. The weights must sum to 1.0 for the aggregated score to be between 0 and 1.
* `target_option`: If specified, the score for the criterion will be 1.0 if the result matches this option, and 0.0 otherwise, regardless of the option's score.
* `score_threshold`: If specified, the score for the criterion will be 1.0 if the result score is above this threshold, and 0.0 otherwise.
* `required`: If set to `True`, the aggregated score will be 0.0 if the score for this criterion does not match the maximum possible value (i.e., its weight).

By default, the scores for each criterion are normalized between 0 and 1 based on the minimum and maximum scores of the criterion's options. To disable this, pass `normalize_scores=False` to the MultiCriteria object.

### Multi-Criteria Example Usage

Here's an example of how to use multi-criteria evaluation:

```python
from typing import cast

from evalassist.judges import DirectInstanceResult, DirectJudge
from evalassist.judges.const import DEFAULT_JUDGE_INFERENCE_PARAMS
from evalassist.judges.types import MultiCriteriaDirectInstanceResult
from unitxt.inference import CrossProviderInferenceEngine

judge = DirectJudge(
    inference_engine=CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        **DEFAULT_JUDGE_INFERENCE_PARAMS,
    ),
    generate_feedback=True,
)

results: list[MultiCriteriaDirectInstanceResult] = judge.evaluate_multi_criteria(
    instances=[
        "Use the API client to fetch data from the server and the cache to store frequently accessed results for faster performance.",
    ],
    multi_criteria=[  # Creates a multi criteria with equal weights
        "Is the text self-explanatory and self-contained?",  # Creates yes/no direct assessment criteria
        "Is the text consistent?",  # Creates yes/no direct assessment criteria
    ],
)

print(f"Aggregated score: {results[0].aggregated_score:.2f}")
for item_result, multi_criteria_item in zip(
    results[0].item_results, results[0].multi_criteria.items
):
    print(
        f"{multi_criteria_item.criterion.name} -> {cast(DirectInstanceResult, item_result.result).score} (weighted: {item_result.weighted_score})"
    )
```

## Available Judges

EvalAssist implements a [Judge API](./base.py) for easily defining and trying different LLM judges. Currently, the following judges are available:

* **PairwiseJudge**: A judge that compares two or more responses to determine which is better based on the given criteria. It is particularly useful for evaluating the quality of responses in a pairwise manner. Each comparison requires one model call as all responses are compared at once.
* **DirectJudge**: main judge implementation. A judge that uses structured output parsing to make evaluations. It accepts the following parameters:

  * `generate_feedback`: generate feedback as actionable suggestions if the evaluation result is not optimal. Can be used to automatically fix the evaluated text.
  * `judge_description_prompt`: a judge description to be used in the prompt. Defaults to "You are an evaluator. You are an expert on evaluating text based on a rubric."
  * `generate_synthetic_persona`: generate a synthetic persona based on the criteria to be used as the judge description.

This judge uses langchain to parse the structured output. Underlying LLM is asked to generate a json schema derived from a Pydantic model. An output fixing parser is used if the model is unable to generate the correct response format or the content is invalid -e.g. the selected option doesn't exist- by prompting the LLM with the error. It will try as much as three times to generate the correct format. If all generations failed a random option is chosen.

* **UnitxtDirectJudge** and **UnitxtPairwiseJudge**: wrappers for Unitxt judges.

* **MPrometheusDirectJudge** and **MPrometheusPairwiseJudge**: wrapper for the [M-Prometheus judges](https://github.com/prometheus-eval/prometheus-eval).

* **DummyDirectJudge** and **DummyPairwiseJudge**: use as a guide to implement new judges.

### Judge configuration

In addition to the aforementioned judge descriptions, all judges can receive a `check_positional_bias` and a `self_consistency` field in its constructors.

### Benchmarks

Look at [the benchmarks results](https://evalassist-evalassist.hf.space/benchmarks/) to find out how the judges perform on different datasets created to benchmark LLM as a Judge evaluators.

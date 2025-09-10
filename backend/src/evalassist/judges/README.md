# EvalAssist Judges Module

## Overview

The judges module is a component of the EvalAssist project, designed to evaluate instances against a set of criteria. It provides a flexible framework for different types of evaluations, including direct and pairwise assessments.

## Key Components

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
* `DirectJudge` and `PairwiseJudge`: Abstract subclasses for direct and pairwise evaluation judges.

## Creating a Judge

To create a custom judge, you can subclass `DirectJudge` or `PairwiseJudge` and implement the required abstract methods.

## Evaluation Process

The evaluation process involves:

1. Creating an instance of a judge with appropriate configuration.
2. Preparing evaluation instances and criteria.
3. Calling the judge instance with the prepared instances and criteria.
4. Processing the evaluation results.

## Results

Evaluation results content vary between direct, pairwise and multiple criteria evaluations.

* **Direct single criteria result** (DirectInstanceResult): contains information such as the selected option, score, explanation, feedback, positional bias and metadata (depends on the Judge, e.g. the prompt used).
* **Pairwise single criteria result** (PairwiseInstanceResult): Contains detailed information of the contests of the different compared responses: contest results, compared to, explanations, positional bias, certainty, winrate, ranking, selections
* **Direct multiple criteria result** (MultiCriteriaDirectInstanceResult): contains the aggregated score (between 0.0 and 1.0) even if the single criteria doesn't have a numeric score, per criterion score (the numeric score per criterion once weight was applied) and the single criteria results for each instance.
* **Pairwise multiple criteria result**: not implemented yet.

## Single criteria evaluation

The `backend/examples/run_judge.py` file demonstrates how to use the `DirectJudge` class. The `evaluate` method of judges is flexible and can be called with simplified parameters. For instance, the `instances` parameter can be a list of strings or `DirectInstance` objects, and the `criteria` parameter can be a string (which will be translated into account as a yes/no criteria) or a `Criteria` object.

### Example Usage

The `backend/examples/run_judge.py` file demonstrates how to use the `DirectJudge` class:

```python
from evalassist.judges import DirectJudge
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

### Example Usage

Here's an example of how to use multi-criteria evaluation:

```python
from evalassist.judges import DirectJudge, MultiCriteria, MultiCriteriaItem
from evalassist.judges.const import DEFAULT_JUDGE_INFERENCE_PARAMS
from unitxt.inference import CrossProviderInferenceEngine

# Define criteria
criteria1 = Criteria(
    name="clarity",
    description="Is the text clear and easy to understand?",
    options=[
        CriteriaOption(name="Yes", description="", score=1.0),
        CriteriaOption(name="No", description="", score=0.0),
    ],
)

criteria2 = Criteria(
    name="relevance",
    description="Is the text relevant to the topic?",
    options=[
        CriteriaOption(name="Yes", description="", score=1.0),
        CriteriaOption(name="No", description="", score=0.0),
    ],
)

# Create MultiCriteria
multi_criteria = MultiCriteria(
    items=[
        MultiCriteriaItem(criterion=criteria1, weight=0.6),
        MultiCriteriaItem(criterion=criteria2, weight=0.4),
    ]
)

judge = DirectJudge(
    inference_engine=CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        **DEFAULT_JUDGE_INFERENCE_PARAMS,
    ),
    generate_feedback=True,
)

results = judge.evaluate_multi_criteria(
    instances=[
        "Use the API client to fetch data from the server and the cache to store frequently accessed results for faster performance."
    ],
    multi_criteria=multi_criteria,
)

print("### Aggregated Score")
print(results[0].aggregated_score)
print("\n### Per Criterion Scores")
print(results[0].per_criterion_score)
```

## Available Judges

EvalAssist implements a [Judge API](./base.py) for easily defining and trying different LLM judges. Currently, the following judges are available:

* **DirectJudge**: main judge implementation. A judge that uses structured output parsing to make evaluations. It accepts the following parameters:

* `generate_feedback`: generate feedback as actionable suggestions if the evaluation result is not optimal. Can be used to automatically fix the evaluated text.
* `judge_description_prompt`: a judge description to be used in the prompt. Defaults to "You are an evaluator. You are an expert on evaluating text based on a rubric."
* `generate_synthetic_persona`: generate a synthetic persona based on the criteria to be used as the judge description.

* **UnitxtDirectJudge** and **UnitxtPairwiseJudge**: wrappers for Unitxt judges.

* **MPrometheusDirectJudge** and **MPrometheusPairwiseJudge**: wrapper for the [M-Prometheus judges](https://github.com/prometheus-eval/prometheus-eval).

* **DummyDirectJudge** and **DummyPairwiseJudge**: use as a guide to implement new judges.

Look at [the benchmarks results](https://evalassist-evalassist.hf.space/benchmarks/) to find out how the judges perform on different datasets created to benchmark LLM as a Judge evaluators.

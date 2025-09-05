# Judges Module Summary

## Overview

The judges module is a component of the EvalAssist project, designed to evaluate instances against a set of criteria. It provides a flexible framework for different types of evaluations, including direct and pairwise assessments.

## Key Components

### Types

The module defines several key types in [`types.py`](backend/src/evalassist/judges/types.py):

* `Instance`: Abstract base class for evaluation instances.
* `DirectInstance` and `PairwiseInstance`: Concrete subclasses for direct and pairwise evaluations.
* `Criteria` and `CriteriaOption`: Classes representing evaluation criteria and their options.
* `DirectInstanceResult` and `PairwiseInstanceResult`: Classes for storing evaluation results.
* `MultiCriteria` and `MultiCriteriaItem`: Classes for defining and evaluating multiple criteria simultaneously.
* `MultiCriteriaDirectInstanceResult`: Class for storing results of multi-criteria direct evaluations.

### Base Classes

The `base.py` file contains abstract base classes for judges:

* `Judge`: The main abstract base class for all judges.
* `DirectJudge` and `PairwiseJudge`: Abstract subclasses for direct and pairwise evaluation judges.

## Example Usage

The `backend/examples/run_judge.py` file demonstrates how to use the `SimpleDirectJudge` class:

```python
from evalassist.judges import SimpleDirectJudge
from evalassist.judges.const import DEFAULT_JUDGE_INFERENCE_PARAMS
from unitxt.inference import CrossProviderInferenceEngine

judge = SimpleDirectJudge(
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

Here's an example of how to use multi-criteria evaluation:

```python
from evalassist.judges import SimpleDirectJudge, MultiCriteria, MultiCriteriaItem
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

judge = SimpleDirectJudge(
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

## Creating a Judge

To create a custom judge, you can subclass `DirectJudge` or `PairwiseJudge` and implement the required abstract methods.

## Evaluation Process

The evaluation process involves:

1. Creating an instance of a judge with appropriate configuration.
2. Preparing evaluation instances and criteria.
3. Calling the judge instance with the prepared instances and criteria.
4. Processing the evaluation results.

## Results

Evaluation results contain information such as the selected option, score, explanation, and feedback. The specific content depends on the judge implementation and the criteria used.

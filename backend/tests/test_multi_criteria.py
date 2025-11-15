import pytest
from evalassist.judges.types import (
    Criteria,
    CriteriaOption,
    DirectInstanceResult,
    Instance,
    MultiCriteria,
    MultiCriteriaDirectInstanceResult,
    MultiCriteriaItem,
)
from pydantic import ValidationError

dummy_direct_instance = Instance(fields={"response": "response"})


def test_single_criteria_weighted():
    criterion = Criteria(
        name="test_criterion",
        description="Test criterion",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
        to_evaluate_field="response",
    )

    instance_result = DirectInstanceResult(
        criteria=criterion,
        selected_option="Good",
        score=1.0,
        explanation="",
        feedback=None,
        instance=dummy_direct_instance,
    )

    multi_criteria_item = MultiCriteriaItem(criterion=criterion, weight=1.0)
    multi_criteria = MultiCriteria(items=[multi_criteria_item])

    assert multi_criteria.get_result([instance_result]).aggregated_score == 1.0


def test_multiple_criteria_weighted():
    criterion1 = Criteria(
        name="criterion1",
        description="Criterion 1",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
        to_evaluate_field="response",
    )

    criterion2 = Criteria(
        name="criterion2",
        description="Criterion 2",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
        to_evaluate_field="response",
    )

    result1 = DirectInstanceResult(
        criteria=criterion1,
        selected_option="Good",
        score=1.0,
        explanation="",
        feedback=None,
        instance=dummy_direct_instance,
    )
    result2 = DirectInstanceResult(
        criteria=criterion2,
        selected_option="Bad",
        score=0.0,
        explanation="",
        feedback=None,
        instance=dummy_direct_instance,
    )

    item1 = MultiCriteriaItem(criterion=criterion1, weight=0.6)
    item2 = MultiCriteriaItem(criterion=criterion2, weight=0.4)

    multi_criteria = MultiCriteria(items=[item1, item2])

    assert multi_criteria.get_result([result1, result2]).aggregated_score == 0.6


def test_required_criteria():
    criterion = Criteria(
        name="test_criterion",
        description="Test criterion",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
        to_evaluate_field="response",
    )

    instance_result = DirectInstanceResult(
        criteria=criterion,
        selected_option="Bad",
        score=0.0,
        explanation="",
        feedback=None,
        instance=dummy_direct_instance,
    )
    multi_criteria_item = MultiCriteriaItem(
        criterion=criterion, weight=1.0, required=True
    )
    multi_criteria = MultiCriteria(items=[multi_criteria_item])

    assert multi_criteria.get_result([instance_result]).aggregated_score == 0.0


def test_normalized_scores():
    criterion = Criteria(
        name="test_criterion",
        description="Test criterion",
        options=[
            CriteriaOption(name="Good", description="", score=10.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
        to_evaluate_field="response",
    )

    result = DirectInstanceResult(
        criteria=criterion,
        selected_option="Good",
        score=1.0,
        explanation="",
        feedback=None,
        instance=dummy_direct_instance,
    )

    multi_criteria_item = MultiCriteriaItem(criterion=criterion, weight=1.0)
    multi_criteria = MultiCriteria(items=[multi_criteria_item])

    assert multi_criteria.get_result([result]).aggregated_score == 1.0


def test_zero_weight():
    criterion = Criteria(
        name="test_criterion",
        description="Test criterion",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
        to_evaluate_field="response",
    )

    with pytest.raises(ValidationError):
        MultiCriteria(items=[MultiCriteriaItem(criterion=criterion, weight=0.0)])


def test_missing_result():
    criterion1 = Criteria(
        name="criterion1",
        description="Criterion 1",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
        to_evaluate_field="response",
    )
    criterion2 = Criteria(
        name="criterion2",
        description="Criterion 2",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
        to_evaluate_field="response",
    )

    instance_result = DirectInstanceResult(
        criteria=criterion1,
        selected_option="Good",
        score=1.0,
        explanation="",
        feedback=None,
        instance=dummy_direct_instance,
    )

    item1 = MultiCriteriaItem(criterion=criterion1, weight=0.6)
    item2 = MultiCriteriaItem(criterion=criterion2, weight=0.4, required=True)

    multi_criteria = MultiCriteria(items=[item1, item2])

    with pytest.raises(ValueError):
        multi_criteria.get_result([instance_result])


def test_strategy_mix():
    criterion_a = Criteria(
        name="test_criterion_a",
        description="Test criterion",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
        to_evaluate_field="response",
    )
    criterion_b = Criteria(
        name="test_criterion_b",
        description="Test criterion",
        options=[
            CriteriaOption(name="Correct", description="", score=5.0),
            CriteriaOption(name="Incorrect", description="", score=0.0),
        ],
        to_evaluate_field="response",
    )
    criterion_c = Criteria(
        name="test_criterion_c",
        description="Test criterion",
        options=[
            CriteriaOption(name="Yes", description=""),
            CriteriaOption(name="No", description=""),
        ],
        to_evaluate_field="response",
    )

    instance_result_a = DirectInstanceResult(
        criteria=criterion_a,
        selected_option="Good",
        score=1.0,
        explanation="",
        feedback=None,
        instance=dummy_direct_instance,
    )
    instance_result_b = DirectInstanceResult(
        criteria=criterion_b,
        selected_option="Correct",
        score=1.0,
        explanation="",
        feedback=None,
        instance=dummy_direct_instance,
    )
    instance_result_c = DirectInstanceResult(
        criteria=criterion_c,
        selected_option="Yes",
        score=None,
        explanation="",
        feedback=None,
        instance=dummy_direct_instance,
    )

    item_a = MultiCriteriaItem(criterion=criterion_a, weight=0.6)
    item_b = MultiCriteriaItem(criterion=criterion_b, weight=0.2)
    item_c = MultiCriteriaItem(criterion=criterion_c, weight=0.2, target_option="Yes")

    multi_criteria = MultiCriteria(
        items=[item_a, item_b, item_c], normalize_scores=True
    )

    instance_results: list[DirectInstanceResult] = [
        instance_result_a,
        instance_result_b,
        instance_result_c,
    ]
    result: MultiCriteriaDirectInstanceResult = multi_criteria.get_result(
        instance_results
    )

    assert result.aggregated_score == 1.0

    criterion_d = Criteria(
        name="test_criterion_d",
        description="Test criterion",
        options=[
            CriteriaOption(name="Yes", description=""),
            CriteriaOption(name="No", description=""),
        ],
        to_evaluate_field="response",
    )

    instance_result_d = DirectInstanceResult(
        criteria=criterion_d,
        selected_option="Yes",
        score=None,
        explanation="",
        feedback=None,
        instance=dummy_direct_instance,
    )

    item_a.weight = 0.4
    item_d = MultiCriteriaItem(
        criterion=criterion_d, weight=0.2, required=True, target_option="No"
    )

    multi_criteria = MultiCriteria(
        items=[item_a, item_b, item_c, item_d], normalize_scores=False
    )

    instance_results.append(instance_result_d)
    result = multi_criteria.get_result(instance_results)
    assert result.aggregated_score == 0.0

    assert result.item_results[0].weighted_score == 0.4

    instance_result_b.score = 5.0
    assert item_b.get_score(result=instance_result_b, normalize_score=False) == 5.0

    assert item_c.get_score(result=instance_result_c, normalize_score=False) == 1.0

    assert item_d.get_score(result=instance_result_d, normalize_score=False) == 0.0


def test_target_option():
    criterion = Criteria(
        name="test_criterion",
        description="Test criterion",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
        to_evaluate_field="response",
    )

    instance_result = DirectInstanceResult(
        criteria=criterion,
        selected_option="Good",
        score=1.0,
        explanation="",
        feedback=None,
        instance=dummy_direct_instance,
    )

    multi_criteria = MultiCriteria(
        items=[MultiCriteriaItem(criterion=criterion, weight=1.0, target_option="Good")]
    )
    assert multi_criteria.get_result([instance_result]).aggregated_score == 1.0

    instance_result = DirectInstanceResult(
        criteria=criterion,
        selected_option="Bad",
        score=0.0,
        explanation="",
        feedback=None,
        instance=dummy_direct_instance,
    )

    assert multi_criteria.get_result([instance_result]).aggregated_score == 0.0


def test_score_threshold():
    criterion = Criteria(
        name="test_criterion",
        description="Test criterion",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
        to_evaluate_field="response",
    )

    instance_result = DirectInstanceResult(
        criteria=criterion,
        selected_option="Good",
        score=1.0,
        explanation="",
        feedback=None,
        instance=dummy_direct_instance,
    )

    multi_criteria = MultiCriteria(
        items=[MultiCriteriaItem(criterion=criterion, weight=1.0, score_threshold=0.5)]
    )

    assert multi_criteria.get_result([instance_result]).aggregated_score == 1.0

    instance_result = DirectInstanceResult(
        criteria=criterion,
        selected_option="Bad",
        score=0.0,
        explanation="",
        feedback=None,
        instance=dummy_direct_instance,
    )

    assert multi_criteria.get_result([instance_result]).aggregated_score == 0.0


def test_duplicate_criteria_names():
    criterion1 = Criteria(
        name="criterion1",
        description="Criterion 1",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
        to_evaluate_field="response",
    )
    criterion2 = Criteria(
        name="criterion1",  # duplicate name
        description="Criterion 2",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
        to_evaluate_field="response",
    )

    with pytest.raises(ValidationError):
        MultiCriteria(
            items=[
                MultiCriteriaItem(criterion=criterion1, weight=0.5),
                MultiCriteriaItem(criterion=criterion2, weight=0.5),
            ]
        )

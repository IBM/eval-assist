import pytest
from evalassist.judges.types import (
    Criteria,
    CriteriaOption,
    DirectInstance,
    DirectInstanceResult,
    MultiCriteria,
    MultiCriteriaItem,
)
from pydantic import ValidationError

dummy_direct_instance = DirectInstance(response="")


def test_single_criteria_weighted():
    criterion = Criteria(
        name="test_criterion",
        description="Test criterion",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
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

    aggregated_score = multi_criteria.get_aggregated_score(
        [multi_criteria_item.get_result(result)]
    )

    assert aggregated_score == 1.0


def test_multiple_criteria_weighted():
    criterion1 = Criteria(
        name="criterion1",
        description="Criterion 1",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
    )

    criterion2 = Criteria(
        name="criterion2",
        description="Criterion 2",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
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

    aggregated_score = multi_criteria.get_aggregated_score(
        [item1.get_result(result1), item2.get_result(result2)]
    )

    assert aggregated_score == 0.6


def test_required_criteria():
    criterion = Criteria(
        name="test_criterion",
        description="Test criterion",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
    )

    result = DirectInstanceResult(
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

    aggregated_score = multi_criteria.get_aggregated_score(
        [multi_criteria_item.get_result(result)]
    )
    assert aggregated_score == 0.0


def test_normalized_scores():
    criterion = Criteria(
        name="test_criterion",
        description="Test criterion",
        options=[
            CriteriaOption(name="Good", description="", score=10.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
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

    aggregated_score = multi_criteria.get_aggregated_score(
        [multi_criteria_item.get_result(result)]
    )

    assert aggregated_score == 1.0


def test_zero_weight():
    criterion = Criteria(
        name="test_criterion",
        description="Test criterion",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
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
    )
    criterion2 = Criteria(
        name="criterion2",
        description="Criterion 2",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
    )

    result1 = DirectInstanceResult(
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
        multi_criteria.get_aggregated_score([item1.get_result(result1)])


def test_strategy_mix():
    criterion_a = Criteria(
        name="test_criterion_a",
        description="Test criterion",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
    )
    criterion_b = Criteria(
        name="test_criterion_b",
        description="Test criterion",
        options=[
            CriteriaOption(name="Correct", description="", score=5.0),
            CriteriaOption(name="Incorrect", description="", score=0.0),
        ],
    )
    criterion_c = Criteria(
        name="test_criterion_c",
        description="Test criterion",
        options=[
            CriteriaOption(name="Yes", description=""),
            CriteriaOption(name="No", description=""),
        ],
    )

    result_a = DirectInstanceResult(
        criteria=criterion_a,
        selected_option="Good",
        score=1.0,
        explanation="",
        feedback=None,
        instance=dummy_direct_instance,
    )
    result_b = DirectInstanceResult(
        criteria=criterion_b,
        selected_option="Correct",
        score=1.0,
        explanation="",
        feedback=None,
        instance=dummy_direct_instance,
    )
    result_c = DirectInstanceResult(
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

    aggregated_score = multi_criteria.get_aggregated_score(
        [
            item_a.get_result(result_a),
            item_b.get_result(result_b),
            item_c.get_result(result_c),
        ]
    )
    assert aggregated_score == 1.0

    criterion_d = Criteria(
        name="test_criterion_d",
        description="Test criterion",
        options=[
            CriteriaOption(name="Yes", description=""),
            CriteriaOption(name="No", description=""),
        ],
    )

    result_d = DirectInstanceResult(
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

    aggregated_score = multi_criteria.get_aggregated_score(
        [
            item_a.get_result(result_a),
            item_b.get_result(result_b),
            item_c.get_result(result_c),
            item_d.get_result(result_d),
        ]
    )
    assert aggregated_score == 0.0

    assert item_a.get_score(result=result_a) == 1.0
    result_b.score = 5.0
    assert item_b.get_score(result=result_b) == 5.0
    assert item_c.get_score(result=result_c) == 1.0
    assert item_d.get_score(result=result_d) == 0.0


def test_target_option():
    criterion = Criteria(
        name="test_criterion",
        description="Test criterion",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
    )

    result = DirectInstanceResult(
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
    multi_criteria_item = multi_criteria.items[0]

    aggregated_score = multi_criteria.get_aggregated_score(
        [multi_criteria_item.get_result(result)]
    )
    assert aggregated_score == 1.0

    result = DirectInstanceResult(
        criteria=criterion,
        selected_option="Bad",
        score=0.0,
        explanation="",
        feedback=None,
        instance=dummy_direct_instance,
    )

    aggregated_score = multi_criteria.get_aggregated_score(
        [multi_criteria_item.get_result(result)]
    )
    assert aggregated_score == 0.0


def test_score_threshold():
    criterion = Criteria(
        name="test_criterion",
        description="Test criterion",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
    )

    result = DirectInstanceResult(
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
    multi_criteria_item = multi_criteria.items[0]

    aggregated_score = multi_criteria.get_aggregated_score(
        [multi_criteria_item.get_result(result)]
    )
    assert aggregated_score == 1.0

    result = DirectInstanceResult(
        criteria=criterion,
        selected_option="Bad",
        score=0.0,
        explanation="",
        feedback=None,
        instance=dummy_direct_instance,
    )
    aggregated_score = multi_criteria.get_aggregated_score(
        [multi_criteria_item.get_result(result)]
    )
    assert aggregated_score == 0.0


def test_duplicate_criteria_names():
    criterion1 = Criteria(
        name="criterion1",
        description="Criterion 1",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
    )
    criterion2 = Criteria(
        name="criterion1",  # duplicate name
        description="Criterion 2",
        options=[
            CriteriaOption(name="Good", description="", score=1.0),
            CriteriaOption(name="Bad", description="", score=0.0),
        ],
    )

    with pytest.raises(ValidationError):
        MultiCriteria(
            items=[
                MultiCriteriaItem(criterion=criterion1, weight=0.5),
                MultiCriteriaItem(criterion=criterion2, weight=0.5),
            ]
        )

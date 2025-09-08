import unittest

from evalassist.judges.types import (
    Criteria,
    CriteriaOption,
    DirectInstanceResult,
    MultiCriteria,
    MultiCriteriaItem,
)
from pydantic import ValidationError


class TestMultiCriteria(unittest.TestCase):
    def test_single_criteria_weighted(self):
        # Create a single criterion
        criterion = Criteria(
            name="test_criterion",
            description="Test criterion",
            options=[
                CriteriaOption(name="Good", description="", score=1.0),
                CriteriaOption(name="Bad", description="", score=0.0),
            ],
        )

        # Create a DirectInstanceResult with a specific option
        result = DirectInstanceResult(
            criteria=criterion,
            option="Good",
            score=1.0,
            explanation="",
            feedback=None,
        )

        multi_criteria_item = MultiCriteriaItem(criterion=criterion, weight=1.0)

        # Create a MultiCriteria with weighted criterion
        multi_criteria = MultiCriteria(items=[multi_criteria_item])

        # Calculate aggregated score
        aggregated_score = multi_criteria.get_aggregated_score(
            [multi_criteria_item.get_result(result)]
        )

        self.assertEqual(aggregated_score, 1.0)

    def test_multiple_criteria_weighted(self):
        # Create multiple criteria
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

        # Create DirectInstanceResults
        result1 = DirectInstanceResult(
            criteria=criterion1,
            option="Good",
            score=1.0,
            explanation="",
            feedback=None,
        )

        result2 = DirectInstanceResult(
            criteria=criterion2,
            option="Bad",
            score=0.0,
            explanation="",
            feedback=None,
        )

        # Create MultiCriteriaItems
        item1 = MultiCriteriaItem(criterion=criterion1, weight=0.6)
        item2 = MultiCriteriaItem(criterion=criterion2, weight=0.4)

        # Create a MultiCriteria with weighted criteria
        multi_criteria = MultiCriteria(
            items=[
                item1,
                item2,
            ]
        )

        # Calculate aggregated score
        aggregated_score = multi_criteria.get_aggregated_score(
            [item1.get_result(result1), item2.get_result(result2)]
        )

        self.assertEqual(aggregated_score, 0.6)

    def test_required_criteria(self):
        # Create a criterion
        criterion = Criteria(
            name="test_criterion",
            description="Test criterion",
            options=[
                CriteriaOption(name="Good", description="", score=1.0),
                CriteriaOption(name="Bad", description="", score=0.0),
            ],
        )

        # Create a DirectInstanceResult with a score not equal to the weight
        result = DirectInstanceResult(
            criteria=criterion,
            option="Bad",
            score=0.0,
            explanation="",
            feedback=None,
        )

        # Create a MultiCriteria with a required criterion
        multi_criteria_item = MultiCriteriaItem(
            criterion=criterion, weight=1.0, required=True
        )
        multi_criteria = MultiCriteria(items=[multi_criteria_item])

        # Calculate aggregated score
        aggregated_score = multi_criteria.get_aggregated_score(
            [multi_criteria_item.get_result(result)]
        )

        self.assertEqual(aggregated_score, 0.0)

    def test_normalized_scores(self):
        # Create a criterion with non-normalized scores
        criterion = Criteria(
            name="test_criterion",
            description="Test criterion",
            options=[
                CriteriaOption(name="Good", description="", score=10.0),
                CriteriaOption(name="Bad", description="", score=0.0),
            ],
        )

        # Create a DirectInstanceResult
        result = DirectInstanceResult(
            criteria=criterion,
            option="Good",
            score=1.0,
            explanation="",
            feedback=None,
        )

        # Create a MultiCriteria
        multi_criteria_item = MultiCriteriaItem(criterion=criterion, weight=1.0)
        multi_criteria = MultiCriteria(items=[multi_criteria_item])

        # Calculate aggregated score
        aggregated_score = multi_criteria.get_aggregated_score(
            [multi_criteria_item.get_result(result)]
        )

        self.assertEqual(aggregated_score, 1.0)

    def test_zero_weight(self):
        # Create a criterion
        criterion = Criteria(
            name="test_criterion",
            description="Test criterion",
            options=[
                CriteriaOption(name="Good", description="", score=1.0),
                CriteriaOption(name="Bad", description="", score=0.0),
            ],
        )

        # Create a MultiCriteria with zero weight
        with self.assertRaises(ValidationError):
            MultiCriteria(items=[MultiCriteriaItem(criterion=criterion, weight=0.0)])

    def test_missing_result(self):
        # Create multiple criteria
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

        # Create a DirectInstanceResult
        result1 = DirectInstanceResult(
            criteria=criterion1,
            option="Good",
            score=1.0,
            explanation="",
            feedback=None,
        )

        # Create MultiCriteriaItems
        item1 = MultiCriteriaItem(criterion=criterion1, weight=0.6)
        item2 = MultiCriteriaItem(criterion=criterion2, weight=0.4, required=True)

        # Create a MultiCriteria
        multi_criteria = MultiCriteria(
            items=[
                item1,
                item2,
            ]
        )

        # Calculate aggregated score with missing result for criterion2
        with self.assertRaises(ValueError):
            multi_criteria.get_aggregated_score([item1.get_result(result1)])

    def test_strategy_mix(self):
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
            option="Good",
            score=1.0,
            explanation="",
            feedback=None,
        )

        # Create a DirectInstanceResult
        result_b = DirectInstanceResult(
            criteria=criterion_b,
            option="Correct",
            score=1.0,
            explanation="",
            feedback=None,
        )

        result_c = DirectInstanceResult(
            criteria=criterion_c,
            option="Yes",
            score=None,
            explanation="",
            feedback=None,
        )

        item_a = MultiCriteriaItem(criterion=criterion_a, weight=0.6)
        item_b = MultiCriteriaItem(criterion=criterion_b, weight=0.2)
        item_c = MultiCriteriaItem(
            criterion=criterion_c, weight=0.2, target_option="Yes"
        )

        multi_criteria = MultiCriteria(
            items=[
                item_a,
                item_b,
                item_c,
            ],
            normalize_scores=True,
        )

        aggregated_score = multi_criteria.get_aggregated_score(
            [
                item_a.get_result(result_a),
                item_b.get_result(result_b),
                item_c.get_result(result_c),
            ]
        )
        self.assertEqual(aggregated_score, 1.0)

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
            option="Yes",
            score=None,
            explanation="",
            feedback=None,
        )

        item_a.weight = 0.4
        item_d = MultiCriteriaItem(
            criterion=criterion_d, weight=0.2, required=True, target_option="No"
        )

        multi_criteria = MultiCriteria(
            items=[
                item_a,
                item_b,
                item_c,
                item_d,
            ],
            normalize_scores=False,
        )

        aggregated_score = multi_criteria.get_aggregated_score(
            [
                item_a.get_result(result_a),
                item_b.get_result(result_b),
                item_c.get_result(result_c),
                item_d.get_result(result_d),
            ]
        )

        self.assertEqual(aggregated_score, 0.0)

        self.assertEqual(item_a.get_score(result=result_a), 1.0)
        result_b.score = 5.0
        self.assertEqual(item_b.get_score(result=result_b), 5.0)
        self.assertEqual(item_c.get_score(result=result_c), 1.0)
        self.assertEqual(item_d.get_score(result=result_d), 0.0)

    def test_target_option(self):
        # Create a criterion
        criterion = Criteria(
            name="test_criterion",
            description="Test criterion",
            options=[
                CriteriaOption(name="Good", description="", score=1.0),
                CriteriaOption(name="Bad", description="", score=0.0),
            ],
        )

        # Create a DirectInstanceResult
        result = DirectInstanceResult(
            criteria=criterion,
            option="Good",
            score=1.0,
            explanation="",
            feedback=None,
        )

        # Create a MultiCriteriaItem with target_option
        multi_criteria = MultiCriteria(
            items=[
                MultiCriteriaItem(criterion=criterion, weight=1.0, target_option="Good")
            ]
        )
        multi_criteria_item = multi_criteria.items[0]

        # Calculate aggregated score
        aggregated_score = multi_criteria.get_aggregated_score(
            [multi_criteria_item.get_result(result)]
        )

        self.assertEqual(aggregated_score, 1.0)

        # Create a DirectInstanceResult with different option
        result = DirectInstanceResult(
            criteria=criterion,
            option="Bad",
            score=0.0,
            explanation="",
            feedback=None,
        )

        # Calculate aggregated score
        aggregated_score = multi_criteria.get_aggregated_score(
            [multi_criteria_item.get_result(result)]
        )

        self.assertEqual(aggregated_score, 0.0)

    def test_score_threshold(self):
        # Create a criterion
        criterion = Criteria(
            name="test_criterion",
            description="Test criterion",
            options=[
                CriteriaOption(name="Good", description="", score=1.0),
                CriteriaOption(name="Bad", description="", score=0.0),
            ],
        )

        # Create a DirectInstanceResult
        result = DirectInstanceResult(
            criteria=criterion,
            option="Good",
            score=1.0,
            explanation="",
            feedback=None,
        )

        # Create a MultiCriteriaItem with score_threshold
        multi_criteria = MultiCriteria(
            items=[
                MultiCriteriaItem(criterion=criterion, weight=1.0, score_threshold=0.5)
            ]
        )
        multi_criteria_item = multi_criteria.items[0]

        # Calculate aggregated score
        aggregated_score = multi_criteria.get_aggregated_score(
            [multi_criteria_item.get_result(result)]
        )

        self.assertEqual(aggregated_score, 1.0)

        # Create a DirectInstanceResult with score below threshold
        result = DirectInstanceResult(
            criteria=criterion,
            option="Bad",
            score=0.0,
            explanation="",
            feedback=None,
        )

        # Calculate aggregated score
        aggregated_score = multi_criteria.get_aggregated_score(
            [multi_criteria_item.get_result(result)]
        )

        self.assertEqual(aggregated_score, 0.0)

    def test_duplicate_criteria_names(self):
        # Create multiple criteria with duplicate names
        criterion1 = Criteria(
            name="criterion1",
            description="Criterion 1",
            options=[
                CriteriaOption(name="Good", description="", score=1.0),
                CriteriaOption(name="Bad", description="", score=0.0),
            ],
        )

        criterion2 = Criteria(
            name="criterion1",  # Duplicate name
            description="Criterion 2",
            options=[
                CriteriaOption(name="Good", description="", score=1.0),
                CriteriaOption(name="Bad", description="", score=0.0),
            ],
        )

        # Create a MultiCriteria with duplicate criteria names
        with self.assertRaises(ValidationError):
            MultiCriteria(
                items=[
                    MultiCriteriaItem(criterion=criterion1, weight=0.5),
                    MultiCriteriaItem(criterion=criterion2, weight=0.5),
                ]
            )


if __name__ == "__main__":
    unittest.main()

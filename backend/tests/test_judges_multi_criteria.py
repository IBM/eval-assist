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

        # Create a MultiCriteria with weighted criterion
        multi_criteria = MultiCriteria(
            items=[MultiCriteriaItem(criterion=criterion, weight=1.0)]
        )

        # Calculate aggregated score
        aggregated_score = multi_criteria.get_aggregated_score(
            results={criterion.name: result}
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

        # Create a MultiCriteria with weighted criteria
        multi_criteria = MultiCriteria(
            items=[
                MultiCriteriaItem(criterion=criterion1, weight=0.6),
                MultiCriteriaItem(criterion=criterion2, weight=0.4),
            ]
        )

        # Calculate aggregated score
        aggregated_score = multi_criteria.get_aggregated_score(
            results={criterion1.name: result1, criterion2.name: result2}
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
        multi_criteria = MultiCriteria(
            items=[MultiCriteriaItem(criterion=criterion, weight=1.0, required=True)]
        )

        # Calculate aggregated score
        aggregated_score = multi_criteria.get_aggregated_score(
            results={criterion.name: result}
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
        multi_criteria = MultiCriteria(
            items=[MultiCriteriaItem(criterion=criterion, weight=1.0)]
        )

        # Calculate aggregated score
        aggregated_score = multi_criteria.get_aggregated_score(
            results={criterion.name: result}
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

        # Create a MultiCriteria
        multi_criteria = MultiCriteria(
            items=[
                MultiCriteriaItem(criterion=criterion1, weight=0.6),
                MultiCriteriaItem(criterion=criterion2, weight=0.4),
            ]
        )

        # Calculate aggregated score with missing result for criterion2
        with self.assertRaises(ValueError):
            multi_criteria.get_aggregated_score(results={criterion1.name: result1})

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

        # Calculate aggregated score
        aggregated_score = multi_criteria.get_aggregated_score(
            results={criterion.name: result}
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
            results={criterion.name: result}
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

        # Calculate aggregated score
        aggregated_score = multi_criteria.get_aggregated_score(
            results={criterion.name: result}
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
            results={criterion.name: result}
        )

        self.assertEqual(aggregated_score, 0.0)


if __name__ == "__main__":
    unittest.main()

import logging
from collections.abc import Sequence
from typing import cast

from evalassist.judges import CriteriaOption

from .base import DirectJudge
from .simple_direct_judge import SimpleDirectJudge
from .types import Criteria, DirectInstance, DirectInstanceResult

logger = logging.getLogger(__name__)


class CriticizedDirectJudge(DirectJudge):
    def get_name(self) -> str:
        return "criticized"

    def _run(
        self,
        instances: Sequence[DirectInstance],
        criteria: Sequence[Criteria],
    ) -> Sequence[DirectInstanceResult]:
        simple_judge = SimpleDirectJudge(self.inference_engine)
        logger.info(f"Running evaluation on {len(instances)} instances...")
        results = simple_judge(instances, criteria)
        criticize_criterion = Criteria(
            name="Judge quality",
            description=(
                "Evaluate the quality of the judge’s reasoning and decision. "
                "Consider whether the explanation is logically consistent, well-grounded "
                "in the provided judge prompt, and whether the selected option is justified. "
            ),
            context_fields=["judge_prompt", "explanation"],
            prediction_field="selected_option",
            options=[
                CriteriaOption(
                    name="Excellent",
                    description="The reasoning is clear, well-structured, and fully aligned with the judge prompt. The chosen option is correct and well-justified.",
                    score=1.0,
                ),
                CriteriaOption(
                    name="Acceptable",
                    description="The reasoning and choice are generally sound, but there may be minor issues in clarity, completeness, or justification.",
                    score=0.5,
                ),
                CriteriaOption(
                    name="Could be Improved",
                    description="The reasoning or chosen option shows noticeable gaps, inconsistencies, or unclear justification. Feedback is needed to help improve the judge.",
                    score=0.25,
                ),
                CriteriaOption(
                    name="Bad",
                    description="The reasoning is flawed, unclear, or inconsistent with the judge prompt, and the chosen option is incorrect or poorly justified.",
                    score=0.0,
                ),
            ],
        )

        criticize_judge = SimpleDirectJudge(
            self.inference_engine,
            generate_feedback=True,
        )

        logger.info("Criticizing the results...")
        criticized_results = criticize_judge(
            instances=[
                DirectInstance(
                    context={
                        "judge_prompt": result.metadata["prompt"],  # type: ignore
                        "explanation": result.explanation,
                    },
                    response=result.option,
                )
                for result in results
            ],
            criteria=criticize_criterion,
        )

        to_revisit_results_index = [
            i
            for i, criticized_result in enumerate(criticized_results)
            if cast(float, criticized_result.score) < 0.5
        ]
        logger.info(
            f"Running the evaluation again taking the feedback into account for {len(to_revisit_results_index)} instances..."
        )

        revisited_results = {
            to_revisit_result_index: revisited_result
            for to_revisit_result_index, revisited_result in zip(
                to_revisit_results_index,
                simple_judge(
                    instances=[
                        DirectInstance(
                            context={
                                **(
                                    cast(
                                        dict, instances[to_revisit_result_index].context
                                    )
                                    if instances[to_revisit_result_index].context
                                    else {}
                                ),
                                "Feedback from previous evaluation": f"The previous time you evaluated this instance, your evaluation was categorized as '{criticized_results[to_revisit_result_index].option}'. In order to improve it, take the following feedback into account: {cast(str, criticized_results[to_revisit_result_index].feedback)}"
                                if criticized_results[to_revisit_result_index].feedback
                                != ""
                                else "Nothing to improve",
                            },
                            response=instances[to_revisit_result_index].response,
                        )
                        for to_revisit_result_index in to_revisit_results_index
                    ],
                    criteria=[
                        Criteria(
                            description=f"{criteria[to_revisit_result_index].description} Important: take the judge feedback into account to improve your judgement",
                            name=criteria[to_revisit_result_index].name,
                            options=criteria[to_revisit_result_index].options,
                            context_fields=[
                                *(
                                    cast(
                                        list,
                                        criteria[
                                            to_revisit_result_index
                                        ].context_fields,
                                    )
                                    if criteria[to_revisit_result_index].context_fields
                                    is not None
                                    else []
                                ),
                                "judge_feedback",
                            ],
                            prediction_field=criteria[
                                to_revisit_result_index
                            ].prediction_field,
                        )
                        for to_revisit_result_index in to_revisit_results_index
                    ],
                ),
            )
        }

        for result in results:
            if result.metadata is None:
                result.metadata = {}
            result.metadata["original_result"] = result.model_dump()
            result.metadata["required_improvement"] = False

        for to_revisit_result_index, revisited_result in revisited_results.items():
            if revisited_result.metadata is None:
                revisited_result.metadata = {}
            revisited_result.metadata["required_improvement"] = True
            revisited_result.metadata["original_result"] = results[
                to_revisit_result_index
            ].model_dump()

        final_results = [
            revisited_results[i] if i in revisited_results else results[i]
            for i in range(len(instances))
        ]

        for result, criticized_result in zip(final_results, criticized_results):
            if result.metadata is None:
                result.metadata = {}
            result.metadata["meta_judge_result"] = criticized_result.model_dump()

        return final_results

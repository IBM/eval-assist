# import json
# import logging

# from unitxt.inference import CrossProviderInferenceEngine

# from .base import BaseDirectJudge, Criteria, DirectInstance, DirectInstanceResult

# logger = logging.getLogger(__name__)


# def get_risk_name(unparsed_risk_name: str):
#     risk_name = unparsed_risk_name
#     risk_name = (
#         "_".join(risk_name.split(" ")[(1 if risk_name.startswith("Context") else 2) :])
#         .lower()
#         .replace(" ", "_")
#     )

#     return risk_name if risk_name != "general_harm" else "harm"


# field_map = {
#     "user_message_field": "user_message",
#     "assistant_message_field": "assistant_message",
#     "context_field": "context",
#     "tools_field": "tools",
# }

# criteria_ids = [
#     "social_bias",
#     "jailbreak",
#     "profanity",
#     "sexual_content",
#     "unethical_behavior",
#     "violence",
#     "harm",
#     "groundedness",
#     "answer_relevance",
#     "context_relevance",
#     "function_call",
#     "evasiveness",
#     "harm_engagement",
# ]


# class GraniteGuardianJudge(BaseDirectJudge):
#     def get_prompt(self, messages, guardian_config, think: bool = False) -> str:
#         """Todo"""
#         logger.debug(f"Messages are: {json.dumps(messages, indent=2)}")

#         logger.debug(f"guardian_config is: {guardian_config}")
#         prompt = tokenizer.apply_chat_template(
#             messages,
#             guardian_config=guardian_config,
#             tokenize=False,
#             add_generation_prompt=True,
#             think=think,
#         )
#         logger.debug(f"Prompt is:\n{prompt}")
#         return prompt

#     def _run(
#         self,
#         instances: list[DirectInstance],
#         criteria: list[Criteria],
#     ) -> list[DirectInstanceResult]:
#         inference_engine = CrossProviderInferenceEngine(
#             model="granite-guardian-3-3-8b",
#             provider="rits",
#         )
#         risk_names = [get_risk_name(criterion.name) for criterion in criteria]

#         # Custom criteria

#         # set custom_scoring_schema for custom scoring schema

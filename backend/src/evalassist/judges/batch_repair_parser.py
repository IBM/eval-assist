import json
import logging
import random
from typing import Literal, cast

from evalassist.judges.utils import create_default_instance, sanitize_and_parse_json
from pydantic import BaseModel, ValidationError
from unitxt.inference import InferenceEngine

logger = logging.getLogger(__name__)


class BatchRepairParser:
    def __init__(
        self,
        inference_engine: InferenceEngine,
        max_retries: int = 3,
        on_generation_failure: Literal["raise", "random"] = "random",
    ):
        """
        inference_engine: object with `infer(dataset: list[dict]) -> list[str]`
        max_retries: number of repair rounds
        on_generation_failure: "raise" or "random"
        """
        self.inference_engine: InferenceEngine = inference_engine
        self.max_retries = max_retries
        self.on_generation_failure = on_generation_failure

    def parse_and_repair(
        self,
        unparsed_responses: list[str],
        model_classes: list[type[BaseModel]],
        on_failure_default: list[dict] | dict | None = None,
        previous_messages_list: list[list[dict[str, str]]] | None = None,
    ) -> tuple[list[BaseModel], list[dict]]:
        """
        Parse all responses into Pydantic models, repairing failed responses in batches.
        """
        if isinstance(on_failure_default, dict):
            on_failure_default = [on_failure_default] * len(unparsed_responses)
        n = len(unparsed_responses)
        parsed: list[BaseModel | None] = [None] * n
        metadata: list[dict] = [{} for _ in range(n)]

        # Initial parse attempt
        failures = []
        for i, (text, model_class) in enumerate(zip(unparsed_responses, model_classes)):
            try:
                parsed[i] = self.try_parse(model_class, text)
                metadata[i] = {"generation_failed": False}
            except Exception as e:
                failures.append(i)
                metadata[i] = {
                    "generation_failed": True,
                    "generation_failed_original_output": sanitize_and_parse_json(text),
                    "parsing_error": str(e),
                }

        attempt = 0
        while failures and attempt < self.max_retries:
            attempt += 1
            logger.debug(
                f"BatchRepairParser: repair attempt {attempt}/{self.max_retries} for {len(failures)} items (out of {len(unparsed_responses)} items) using inference engine {self.inference_engine.get_engine_id()}"
            )
            logger.debug(
                f"First incorrect unparsed response (id {failures[0]}) is:\n{unparsed_responses[failures[0]]}"
            )
            logger.debug(
                f"First parsing issue (id {failures[0]}) was:\n{metadata[failures[0]].get('parsing_error', '')}"
            )

            dataset = []
            idx_map = []

            for idx in failures:
                raw_text = unparsed_responses[idx]
                model_class = model_classes[idx]
                prompt_text = self._format_repair_prompt(
                    invalid_output=raw_text,
                    parsing_error=metadata[idx].get("parsing_error", ""),
                    model_class=model_class,
                    previous_messages=previous_messages_list[idx]
                    if previous_messages_list
                    else None,
                )

                dataset.append(
                    {
                        "source": prompt_text,
                        "data_classification_policy": ["public"],
                    }
                )
                idx_map.append(idx)

            # Send batch to inference engine
            try:
                repaired_texts = cast(
                    list[str], self.inference_engine.infer(dataset=dataset)
                )
            except Exception as e:
                logger.exception(
                    "BatchRepairParser: inference_engine.infer failed on retry %s", e
                )
                break

            # Attempt parsing repaired responses
            new_failures = []
            for pos_in_batch, repaired_text in enumerate(repaired_texts):
                original_index = idx_map[pos_in_batch]
                model_class = model_classes[original_index]

                unparsed_responses[original_index] = repaired_text
                metadata[original_index]["generation_failed_last_attempt_output"] = (
                    repaired_text
                )
                metadata[original_index]["repair_attempts"] = attempt

                try:
                    parsed[original_index] = self.try_parse(model_class, repaired_text)
                    metadata[original_index]["generation_failed"] = False
                except Exception as e:
                    metadata[original_index]["parsing_error"] = str(e)
                    new_failures.append(original_index)

            failures = new_failures

        if failures:
            logger.debug(
                f"BatchRepairParser: repairing failed for {len(failures)} items. Applying on_generation_failure='{self.on_generation_failure}'."
            )

        # Fallback for remaining failures
        for i in failures:
            if self.on_generation_failure == "raise":
                raise ValueError(
                    f"Failed to parse response after {attempt} attempts.\n"
                    f"Original output:\n{metadata[i].get('generation_failed_original_output')}\n"
                    f"Last attempt:\n{metadata[i].get('generation_failed_final_output')}\n"
                    f"Error:\n{metadata[i].get('parsing_error')}"
                )

            if on_failure_default is not None:
                defaults: dict = on_failure_default[i]
                for k, v in defaults.items():
                    if isinstance(v, list):
                        defaults[k] = random.choice(v)  # nosec

                model_class = model_classes[i]
                parsed[i] = create_default_instance(model_class, defaults)

                metadata[i]["generation_failed"] = True
                metadata[i]["final_fallback_chosen"] = defaults

        return cast(list[BaseModel], parsed), metadata

    def _format_repair_prompt(
        self,
        invalid_output: str,
        parsing_error: str,
        model_class: type[BaseModel],
        previous_messages: list[dict[str, str]] | None,
    ) -> list[dict[str, str]]:
        """
        Build a repair prompt using the Pydantic model's JSON schema.
        """
        try:
            schema_json = json.dumps(
                model_class.model_json_schema(), indent=2, ensure_ascii=False
            )
        except Exception:
            schema_json = "<unable to generate model schema>"
        messages = []
        if previous_messages is not None:
            messages = [
                *previous_messages,
                {
                    "role": "assistant",
                    "content": invalid_output,
                },
                {
                    "role": "user",
                    "content": "The json string output you generated is invalid and must be fixed to match the expected JSON schema.\n\n"
                    f"INVALID OUTPUT:\n```\n{invalid_output}\n```\n\n"
                    f"PARSING ERROR:\n```\n{parsing_error}\n```\n\n"
                    f"EXPECTED JSON SCHEMA:\n{schema_json}\n\n"
                    "INSTRUCTIONS:\n"
                    "1) Produce a single JSON string strictly conforming to the schema above. Pay special attention to correcly escaping control characters or quotation strings inside json values.\n"
                    "2) Do NOT include explanations or extra text.\n"
                    "3) If the INVALID OUTPUT is a model refusing to generate the requested content. Output a valid JSON with empty fields."
                    "Return only the corrected JSON string.",
                },
            ]
        else:
            messages.append(
                {
                    "role": "user",
                    "content": "You are given an invalid model output that must be corrected "
                    "to match the expected JSON schema.\n\n"
                    f"INVALID OUTPUT:\n```\n{invalid_output}\n```\n\n"
                    f"PARSING ERROR:\n```\n{parsing_error}\n```\n\n"
                    f"EXPECTED JSON SCHEMA:\n{schema_json}\n\n"
                    "INSTRUCTIONS:\n"
                    "1) Produce a single JSON string object strictly conforming to the schema above.\n"
                    "2) Do NOT include explanations or extra text.\n"
                    "3) If a field's value is unknown, use empty string, null, or logical empty value.\n"
                    "4) If the INVALID OUTPUT is a model refusing to generate the requested content. Output a valid JSON with empty fields."
                    "Return only the corrected JSON string.",
                }
            )
        return messages

    def try_parse(self, model_class: type[BaseModel], text: str) -> BaseModel:
        try:
            return model_class.model_validate_json(json_data=text, strict=False)
        except ValidationError:
            return model_class.model_validate_json(
                json_data=sanitize_and_parse_json(text), strict=False
            )

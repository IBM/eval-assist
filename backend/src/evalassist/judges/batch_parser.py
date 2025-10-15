import json
import logging
import random
from typing import Literal

from langchain_core.exceptions import OutputParserException
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class BatchRepairParser:
    def __init__(
        self,
        inference_engine,
        max_retries: int = 3,
        on_generation_failure: Literal["raise", "random"] = "random",
    ):
        """
        inference_engine: object with `infer(dataset: list[dict]) -> list[str]`
        max_retries: number of repair rounds
        on_generation_failure: "raise" or "fallback"
        """
        self.inference_engine = inference_engine
        self.max_retries = max_retries
        self.on_generation_failure = on_generation_failure

    def parse_all_responses(
        self,
        unparsed_responses: list[str],
        output_parsers: list[PydanticOutputParser],
        on_failure_default: list[str | int | list[str | int]] | None = None,
    ) -> tuple[list, list[dict]]:
        """
        Parse all responses using PydanticOutputParser, repairing failed responses in batches.
        """
        n = len(unparsed_responses)

        parsed: list[BaseModel | None] = [None] * n
        metadata = [{}] * n

        # Initial parse attempt
        failures = []
        for i, (text, parser) in enumerate(zip(unparsed_responses, output_parsers)):
            try:
                parsed[i] = parser.parse(text)
                metadata[i] = {"generation_failed": False}
            except OutputParserException as e:
                failures.append(i)
                metadata[i] = {
                    "generation_failed": True,
                    "generation_failed_original_output": text,
                    "parsing_error": str(e),
                }

        attempt = 0
        while failures and attempt < self.max_retries:
            attempt += 1
            logger.debug(
                f"BatchRepairParser: repair attempt {attempt}/{self.max_retries} for {len(failures)} items"
            )

            dataset = []
            idx_map = []

            for idx in failures:
                raw_text = unparsed_responses[idx]
                parser = output_parsers[idx]
                model_class = parser.pydantic_object

                prompt_text: str = self._format_repair_prompt(
                    invalid_output=raw_text,
                    parsing_error=metadata[idx].get("parsing_error", ""),
                    model_class=model_class,
                )

                dataset.append(
                    {
                        "source": prompt_text,
                        "data_classification_policy": ["public"],
                    }
                )
                idx_map.append(idx)

            # Send batch to Unitxt
            try:
                repaired_texts = [
                    str(r) for r in self.inference_engine.infer(dataset=dataset)
                ]
            except Exception as e:
                logger.exception(
                    "BatchRepairParser: inference_engine.infer failed on retry %s", e
                )
                break  # fallback

            # Attempt parsing repaired responses
            new_failures = []
            for pos_in_batch, repaired_text in enumerate(repaired_texts):
                original_index = idx_map[pos_in_batch]
                parser = output_parsers[original_index]

                unparsed_responses[original_index] = repaired_text

                metadata[original_index]["generation_failed_last_attempt_output"] = (
                    repaired_text
                )
                metadata[original_index]["repair_attempts"] = attempt

                try:
                    parsed_obj = parser.parse(repaired_text)
                    parsed[original_index] = parsed_obj
                    metadata[original_index]["generation_failed"] = False
                except OutputParserException as e:
                    metadata[original_index]["parsing_error_after_repair"] = str(e)
                    metadata[original_index]["parsing_error"] = str(e)
                    new_failures.append(original_index)

            failures = new_failures

        # Fallback for remaining failures
        for i in failures:
            if self.on_generation_failure == "raise":
                raise ValueError(
                    f"Failed to parse response after {attempt} attempts.\n"
                    f"Original output:\n{metadata[i].get('generation_failed_original_output')}\n"
                    f"Last attempt:\n{metadata[i].get('generation_failed_final_output')}\n"
                    f"Error:\n{metadata[i].get('parsing_error_after_repair') or metadata[i].get('parsing_error')}"
                )

            if on_failure_default is not None:
                default = on_failure_default[i]
                # TODO: adjust to be applicable to any model
                if default is None:
                    selected_option = ""
                elif isinstance(default, (str, int)):
                    selected_option = default
                else:
                    selected_option = random.choice(default)  # nosec

                parser = output_parsers[i]
                parsed[i] = parser.pydantic_object(
                    selected_option=selected_option,
                    explanation="",
                )

                metadata[i]["generation_failed"] = True
                metadata[i]["final_fallback_chosen"] = selected_option

        # Ensure all metadata entries exist
        for i in range(n):
            if metadata[i] is None:
                metadata[i] = {"generation_failed": False}

        return parsed, metadata

    def _format_repair_prompt(
        self,
        invalid_output: str,
        parsing_error: str,
        model_class: type[BaseModel],
    ) -> str:
        """
        Build a repair prompt using the Pydantic model's JSON schema.
        """
        try:
            schema_json = json.dumps(
                model_class.model_json_schema(), indent=2, ensure_ascii=False
            )
        except Exception:
            schema_json = "<unable to generate model schema>"

        prompt = (
            f"You are given an invalid model output that must be corrected to match the expected JSON schema.\n\n"
            f"INVALID OUTPUT:\n```\n{invalid_output}\n```\n\n"
            f"PARSING ERROR:\n```\n{parsing_error}\n```\n\n"
            f"EXPECTED JSON SCHEMA:\n{schema_json}\n\n"
            "INSTRUCTIONS:\n"
            "1) Produce a single JSON object strictly conforming to the schema above.\n"
            "2) Do NOT include explanations or extra text.\n"
            "3) If a field's value is unknown, use empty string, null, or logical empty value.\n"
            "Return only the corrected JSON object."
        )
        return prompt

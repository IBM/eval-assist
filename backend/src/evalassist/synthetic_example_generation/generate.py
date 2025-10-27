import logging
import os
import uuid
from textwrap import dedent
from typing import cast

from evalassist.judges.batch_repair_parser import BatchRepairParser
from evalassist.judges.utils import (
    build_format_instructions,
    generate_dynamic_pydantic_model,
)
from evalassist.main import DirectInstanceDTO
from langchain_core.prompts import PromptTemplate
from pydantic import Field
from unitxt.inference import InferenceEngine

from ..api_types import (
    CriteriaWithOptionsDTO,
    DirectActionTypeEnum,
    DirectAIActionRequest,
    DomainEnum,
    GenerationLengthEnum,
    PersonaEnum,
    TaskEnum,
)
from ..const import generation_length_to_sentence_count
from ..utils import to_snake_case

logger = logging.getLogger(__name__)


def get_data_path(task: TaskEnum, domain: DomainEnum):
    return os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "data",
        to_snake_case(task.value),
        "source_data",
        "source.jsonl",
    )


class DirectActionGenerator:
    def __init__(
        self,
        action: DirectActionTypeEnum,
        prompt: str | None,
        inference_engine: InferenceEngine,
    ):
        self.action = action
        self.prompt = prompt
        self.inference_engine = inference_engine
        # intialize model

        self.action_third_person_dict = {
            DirectActionTypeEnum.REPHRASE: "rephrases",
            DirectActionTypeEnum.SHORTER: "shortens",
            DirectActionTypeEnum.LONGER: "elaborates on",
        }

        self.action_infinitive_person_dict = {
            DirectActionTypeEnum.REPHRASE: "to rephrase",
            DirectActionTypeEnum.SHORTER: "to shorten",
            DirectActionTypeEnum.LONGER: "to elaborate on",
        }

        self.action_past_dict = {
            DirectActionTypeEnum.REPHRASE: "rephrased",
            DirectActionTypeEnum.SHORTER: "shortened",
            DirectActionTypeEnum.LONGER: "elaborated",
        }

        self.parser = BatchRepairParser(
            inference_engine=self.inference_engine,
            max_retries=3,
            on_generation_failure="random",
        )

    def generate(self, direct_ai_action: DirectAIActionRequest):
        if self.action == DirectActionTypeEnum.CUSTOM:
            action_tag = "<custom_action>"
            dynamic_model = generate_dynamic_pydantic_model(
                model_name="structured_output_model",
                field_definitions=[
                    (
                        "response",
                        str,
                        Field(
                            ...,
                            description="the selection to apply the action to",
                        ),
                        [],
                    ),
                ],
            )
            format_instructions = build_format_instructions(dynamic_model)
            text_with_selection = direct_ai_action.text.replace(
                direct_ai_action.selection,
                action_tag + direct_ai_action.selection + action_tag,
            )
            # prompt templates
            system_prompt_template = dedent(
                """\
                You will be provided with:

                - A selected text

                - A text containing that selection, with the selection marked using {action_tag} tags

                Your task is to {action_description} the selected text such that:

                - It preserves the original meaning and intent

                - It fits seamlessly into the original text, both semantically and grammatically

                ✅ The generated selection must not disrupt the sentence structure or introduce grammatical errors (e.g., missing prepositions or incorrect tense).
                🚫 Do not introduce any new information that is not present in the original text.

                Selection:
                {selection}

                Text with selection (wrapped in-between {action_tag} tags):
                {text_with_selection}

                {format_instructions}
                Don't forget to enclose the response value in double quotes.
            """,
            )

            system_prompt = system_prompt_template.format(
                text_with_selection=text_with_selection,
                selection=direct_ai_action.selection,
                format_instructions=format_instructions,
                action_description=self.prompt,
                action_tag=action_tag,
            )
        elif self.action == DirectActionTypeEnum.REGENERATE:
            dynamic_model = generate_dynamic_pydantic_model(
                model_name="structured_output_model",
                field_definitions=[
                    (
                        "response",
                        str,
                        Field(
                            ...,
                            description="the selection to regenerate",
                        ),
                        [],
                    ),
                ],
            )
            format_instructions = build_format_instructions(dynamic_model)
            action_str = direct_ai_action.action.value.lower()
            action_tag = "<regenerate>"
            text_with_selection = direct_ai_action.text.replace(
                direct_ai_action.selection,
                action_tag + direct_ai_action.selection + action_tag,
            )
            # prompt templates
            system_prompt_template = dedent("""\
                You will be provided with:
                - A selected text
                - A text containing that selection, with the selection marked using <regenerate> tags
                - Your task is to substitute the selected text with a counterfactual example to diversify perspective, demographic, or approach. It should fit seamlessly into the original text. The regenerated selection must not disrupt the sentence structure or introduce grammatical errors (e.g., missing prepositions or incorrect tense).
                - Examples: “toddler” changed to “adult”, “terrorist” changed to “diplomat”, “men” changed to “women”, “easy” changed to “difficult”, “great” changed to “poor”

                Selection:
                {selection}

                Text with selection (wrapped in-between <regenerate> tags):
                {text_with_selection}

                {format_instructions}
                Don't forget to enclose the response value in double quotes.
                """)
            system_prompt = system_prompt_template.format(
                text_with_selection=text_with_selection,
                selection=direct_ai_action.selection,
                format_instructions=format_instructions,
            )
        else:
            dynamic_model = generate_dynamic_pydantic_model(
                model_name="structured_output_model",
                field_definitions=[
                    (
                        "response",
                        str,
                        Field(
                            ...,
                            description=f"the selection to {self.action.value.lower()}",
                        ),
                        [],
                    ),
                ],
            )
            format_instructions = build_format_instructions(dynamic_model)
            action_str = direct_ai_action.action.value.lower()
            action_tag = f"<{action_str}>"
            text_with_selection = direct_ai_action.text.replace(
                direct_ai_action.selection,
                action_tag + direct_ai_action.selection + action_tag,
            )
            # prompt templates
            system_prompt_template = dedent("""\
                You will be provided with:

                - A selected text

                - A text containing that selection, with the selection marked using {action_tag} tags

                Your task is {action_infinitive} the selected text such that:

                - It preserves the original meaning and intent

                - It fits seamlessly into the original text, both semantically and grammatically

                ✅ The {action_past} selection must not disrupt the sentence structure or introduce grammatical errors (e.g., missing prepositions or incorrect tense).
                🚫 Do not introduce any new information that is not present in the original text.

                - If the selection is equal to the whole text, your task is {action_infinitive} the whole text.
                - Examples: “toddler” changed to “kid”, “terrorist” changed to “extremist”, “men” changed to “human”, “easy” changed to “simple”, “great” changed to “excellent”

                Selection:
                {selection}

                Text with selection (wrapped in-between {action_tag} tags):
                {text_with_selection}

                {format_instructions}
                Don't forget to enclose the response value in double quotes.
                """)

            system_prompt = system_prompt_template.format(
                text_with_selection=text_with_selection,
                selection=direct_ai_action.selection,
                action_third_person=self.action_third_person_dict[self.action],
                action_infinitive=self.action_infinitive_person_dict[self.action],
                action_past=self.action_past_dict[self.action],
                action_tag=action_tag,
                format_instructions=format_instructions,
            )

        prompt = system_prompt

        logger.debug(f"Direct AI action prompt:\n{prompt}")

        unparsed_response: str = cast(
            str, self.inference_engine.infer([{"source": prompt}])[0]
        )
        logger.debug(f"Direct AI action unparsed response:\n{unparsed_response}")

        parsed_responses, metadata = self.parser.parse_and_repair(
            [unparsed_response], [dynamic_model]
        )
        parsed_response = parsed_responses[0]
        return parsed_response.model_dump()["response"]


class Generator:
    def __init__(
        self,
        inference_engine: InferenceEngine,
        criteria: CriteriaWithOptionsDTO,
        generation_length: GenerationLengthEnum | None,
        task: TaskEnum | None,
        domain: DomainEnum | None,
        persona: PersonaEnum | None,
        per_criteria_option_count: dict[str, int],
        borderline_count: int,
    ):
        self.inference_engine = inference_engine
        self.criteria: CriteriaWithOptionsDTO = criteria
        self.generation_length = generation_length
        self.task = task
        self.domain = domain
        self.persona = persona
        self.per_criteria_option_count = per_criteria_option_count
        self.borderline_count = borderline_count
        self.has_context_variables = (
            len(
                self.criteria.context_fields
                if self.criteria.context_fields is not None
                else []
            )
            > 0
        )

        system_prompt_input_variables = [
            "dimension",
            "dimension_description",
            "target",
            "target_description_section",
            "domain_section",
            "persona_section",
            "generation_length_section",
            "response_name",
        ]

        self.parser = BatchRepairParser(
            inference_engine=self.inference_engine,
            max_retries=3,
            on_generation_failure="raise",
        )

        if self.task == TaskEnum.QUESTION_ANSWERING:
            self.dynamic_model = generate_dynamic_pydantic_model(
                model_name="structured_output_model",
                field_definitions=[
                    (
                        self.criteria.to_evaluate_field,
                        str,
                        Field(
                            ...,
                            description="the answer to the question",
                        ),
                        [],
                    ),
                ],
            )
            self.format_instructions = build_format_instructions(self.dynamic_model)

            # prompt templates
            self.system_prompt_template = PromptTemplate(
                input_variables=system_prompt_input_variables,
                template=dedent("""\
                    You will be asked to generate an answer to a question according to the following requirements:

                    Criteria name: {dimension}
                    Criteria description: {dimension_description}
                    Criteria dimension target: {target}
                    {target_description_section}

                    Your task is to generate an answer that STRICTLY follows this requirement. This is for evaluation purposes.

                    Important:
                    {domain_section}{persona_section}{generation_length_section}- Focus exclusively on the specified dimension and target
                    - Make sure your answer clearly demonstrates the described characteristics
                    - Do not mention the criteria in your answer - Simply generate an answer to the question that embodies the characteristics
                    """),
            )

            self.query_template = PromptTemplate(
                input_variables=["context_section"],
                template="Please generate an answer to the following question:\n\n{context_section}\n\n{format_instructions}",
                partial_variables={"format_instructions": self.format_instructions},
            )
        elif self.task == TaskEnum.SUMMARIZATION:
            self.dynamic_model = generate_dynamic_pydantic_model(
                model_name="structured_output_model",
                field_definitions=[
                    (
                        self.criteria.context_fields[0],
                        str,
                        Field(
                            ...,
                            description=f"the {self.criteria.context_fields[0]}'s summary",
                        ),
                        [],
                    ),
                ],
            )
            self.format_instructions = build_format_instructions(self.dynamic_model)

            # prompt templates
            self.system_prompt_template = PromptTemplate(
                input_variables=system_prompt_input_variables,
                template=dedent("""\
                    You will be given some source text and will be asked to generate a summary according to a specific target criteria.

                    You should generate a summary that matches the following requirements:
                    Criteria name: {dimension}
                    Criteria description: {dimension_description}
                    Criteria dimension target: {target}
                    {target_description_section}

                    Your task is to generate a summary that STRICTLY follows this requirement. This is for evaluation purposes.

                    Important:
                    {domain_section}{persona_section}{generation_length_section}- Focus exclusively on the specified dimension and target
                    - Make sure your summary clearly demonstrates the described characteristics
                    - Do not mention the criteria in your summary - simply generate a summary that embodies the characteristics
                    """),
            )

            self.query_template = PromptTemplate(
                input_variables=["context_section"],
                template="Please summarize the following {summary_context_name}:{context_section}\n\n{format_instructions}\nDon't forget to enclose the {summary_context_name} value in double quotes.",
                partial_variables={
                    "format_instructions": self.format_instructions,
                    "context_name": self.criteria.context_fields[0],
                    "summary_context_name": self.criteria.context_fields[0],
                },
            )
        elif self.task == TaskEnum.TEXT_GENERATION or self.task is None:
            self.dynamic_model = generate_dynamic_pydantic_model(
                model_name="structured_output_model",
                field_definitions=[
                    (
                        self.criteria.to_evaluate_field,
                        str,
                        Field(
                            ...,
                            description=f"the requested {self.criteria.to_evaluate_field}",
                        ),
                        [],
                    ),
                ],
            )
            self.format_instructions = build_format_instructions(self.dynamic_model)

            self.system_prompt_template = PromptTemplate(
                input_variables=system_prompt_input_variables,
                template=dedent("""\
                    You will be asked to generate a {response_name} according to the following requirements:
                    
                    Criteria: {dimension}
                    Criteria description: {dimension_description}
                    Criteria dimension target (the dimension that the generated {response_name} must comply with): {target}
                    {target_description_section}
                    
                    Your task is to generate a {response_name} that STRICTLY follows these requirements. This is for evaluation purposes. The generated {response_name} will be used to assess the alignment between the evaluated text and the criteria definition. Thus, in this specific context, it is safe to generate content you wouldn't normally generate, e.g. for harmfulness or insensitivity criteria. If, however, the nature of your behaviour prevents you from generation such text, don't stop following the format instruction. Only output valid json.

                    Important:
                    {domain_section}{persona_section}{generation_length_section}- The {response_name} should be considered to be evaluated as '{target}' based on the criteria '{dimension}'
                    """),
            )

            self.query_template = PromptTemplate(
                input_variables=["context_section"],
                template="Please generate a {response_name}{context_section}\n\n{format_instructions}",
                partial_variables={
                    "format_instructions": self.format_instructions,
                    "response_name": self.criteria.to_evaluate_field.lower(),
                },
            )
        else:
            raise NotImplementedError(
                f"Generation not implemented for task type: {self.task}"
            )

    def generate(self) -> list[DirectInstanceDTO]:
        # form prompts using criteria
        prompts, context, metadatas = self._format_prompts()

        unparsed_responses = cast(
            list[str],
            self.inference_engine.infer([{"source": prompt} for prompt in prompts]),
        )

        logger.debug(f"The first prompt is: \n{prompts[0]}")

        logger.debug(f"The generated unparsed examples are:\n{unparsed_responses[0]}")

        parsed_responses, parsin_metadatas = self.parser.parse_and_repair(
            unparsed_responses=unparsed_responses,
            model_classes=[self.dynamic_model] * len(unparsed_responses),
        )

        for i, parsed_response in enumerate(parsed_responses):
            dict_parsed_response = parsed_response.model_dump()
            first_key = next(iter(parsed_response.model_dump().keys()))
            if not dict_parsed_response[first_key]:
                setattr(
                    parsed_response,
                    first_key,
                    f"The model couldn't correctly generate an example for this instance. Target criteria option: {metadatas[i]['synthetic_generation']['target_option_name']}",
                )

        logger.debug(f"The generated parsed examples are:\n{parsed_responses[0]}")

        instances = [
            DirectInstanceDTO(
                context=context,
                response=next(iter(parsed_responses[i].model_dump().values())),
                metadata={
                    **metadatas[i],
                    **parsin_metadatas[i],
                },
                id=str(uuid.uuid4()),
            )
            for i in range(len(parsed_responses))
        ]

        return instances

    def _format_prompts(self):
        prompts, metadatas = [], []

        criteria: CriteriaWithOptionsDTO = self.criteria
        criteria_options_dict = {
            option.name: option.description for option in criteria.options
        }

        if self.borderline_count > 0:
            criteria_borderline = self._get_borderline_criteria(criteria)
            criteria_options_dict[criteria_borderline["name"]] = criteria_borderline[
                "description"
            ]
            # Replace the borderline count by the synthetically generated borderline
            self.per_criteria_option_count[criteria_borderline["name"]] = (
                self.borderline_count
            )

        if self.domain is not None:
            domain_section = f"- The generated {self.criteria.to_evaluate_field.lower()} is going to be evaluated on the {self.domain.value} domain\n"
        else:
            domain_section = ""

        if self.persona is not None:
            persona_section = f"- Adopt the following persona: {self.persona.lower()}\n"
        else:
            persona_section = ""

        if self.generation_length is not None:
            generation_length_section = f"- The generated {self.criteria.to_evaluate_field.lower()}'s length should be {self.generation_length.value.lower()} ({generation_length_to_sentence_count[self.generation_length]} long).\n"
        else:
            generation_length_section = ""

        context: dict[str, str] = {}
        if self.has_context_variables:
            context = self._generate_synthetic_context()

            if (
                self.task == TaskEnum.SUMMARIZATION
                or self.task == TaskEnum.QUESTION_ANSWERING
            ):
                context_section = f"\n{context[self.criteria.context_fields[0]]}"
            else:
                context_placeholders = "\n".join(
                    [
                        f"{name}: {context[name]}"
                        for name in self.criteria.context_fields
                    ]
                )
                context_section = (
                    f" based on the following context:\n\n{context_placeholders}"
                )
        else:
            context_section = ""
        for criteria_option_name in self.per_criteria_option_count.keys():
            criteria_option_description = criteria_options_dict[criteria_option_name]
            if criteria_option_description:
                target_description_section = (
                    f"Criteria dimension description: {criteria_option_description}"
                )
            else:
                target_description_section = ""

            system_prompt_params = {
                "dimension": self.criteria.name,
                "dimension_description": self.criteria.description,
                "target": criteria_option_name,
                "target_description_section": target_description_section,
                "response_name": self.criteria.to_evaluate_field.lower(),
                "domain_section": domain_section,
                "persona_section": persona_section,
                "generation_length_section": generation_length_section,
            }

            system_prompt = self.system_prompt_template.format(**system_prompt_params)

            # for gen_idx in range(self.per_criteria_option_count[criteria_option_name]):
            # if self.task == TaskEnum.QUESTION_ANSWERING:
            #     question = random.choice(self.context_data)[
            #         "question"
            #     ]  # sample random ques tion
            #     contexts.append(dict(zip(self.context_names, [question])))

            #     query = self.query_template.format(question=question)

            # elif self.task == TaskEnum.SUMMARIZATION:
            #     original_text = random.choice(self.context_data)[
            #         "text"
            #     ]  # sample random source article
            #     contexts.append(dict(zip(self.context_names, [original_text])))
            #     query = self.query_template.format(original_text=original_text)

            # if self.task == TaskEnum.QUESTION_ANSWERING or self.task == TaskEnum.SUMMARIZATION or self.task == TaskEnum.TEXT_GENERATION or self.task is None:

            query = self.query_template.format(
                context_section=context_section,
            )

            prompt = system_prompt + "\n\n" + query
            prompts.extend(
                [prompt] * self.per_criteria_option_count[criteria_option_name]
            )
            metadata = {
                "synthetic_generation": {
                    "model_name": self.inference_engine.get_engine_id(),
                    "criteria_name": self.criteria.name,
                    "target_option_name": criteria_option_name,
                    "target_option_description": criteria_option_description,
                    "prompt": prompt,
                    "data_length": self.generation_length.value
                    if self.generation_length
                    else None,
                    "task": self.task.value if self.task else None,
                    "domain": self.domain.value if self.domain else None,
                    "persona": self.persona.value if self.persona else None,
                }
            }
            metadatas.extend(
                [metadata] * self.per_criteria_option_count[criteria_option_name]
            )

        return prompts, context, metadatas

    def _generate_synthetic_context(self) -> dict[str, str]:
        if self.task == TaskEnum.SUMMARIZATION:
            system_prompt_template = PromptTemplate(
                input_variables=[
                    "domain_section",
                ],
                template=dedent("""\
                Your task is to generate a sample paragraph considering the following information:

                - The generated text is intended to be used to generate a summary.
                - The generated text should be 10-20 sentences long.
                {domain_section}
                """),
            )
            # domain_section = f"- Pick a topic that is under the {self.domain.value} domain. The generated text should be related to this topic." if self.domain is not None else ""
            domain_section = (
                f"- You are working within the {self.domain.value} domain. "
                f"First, pick a specific topic _within_ {self.domain.value} (don't pick the domain itself as a topic) "
                if self.domain is not None
                else ""
            )
            system_prompt = system_prompt_template.format(
                domain_section=domain_section,
            )
            dynamic_model = generate_dynamic_pydantic_model(
                model_name="structured_output_model",
                field_definitions=[
                    (
                        "text",
                        str,
                        Field(
                            ...,
                            description="the text to generate",
                        ),
                        [],
                    ),
                ],
            )
            format_instructions = build_format_instructions(self.dynamic_model)
        else:
            system_prompt_template = PromptTemplate(
                input_variables=[
                    "response_name",
                    "context_names",
                    "task_section",
                    "domain_section",
                    "persona_section",
                    "criteria_name",
                    "criteria_description",
                ],
                template=dedent("""\
                You will be provided with a list of context variable names. Your task is to generate example values that simulate *real-life cases* for each of these context variables, considering the following information:

                - Context variables to generate: {context_names}.
                - The generated context is intended to be used to generate a '{response_name}'.{task_section}{domain_section}{persona_section}
                - For each context variable, generate realistic, natural examples that could be used in a dataset for this evaluation.
                - Do not describe the variable itself — instead, produce the actual kind of text or data it would contain in real life.
                - The generated context should make sense as input for generating a {response_name} that will later be evaluated using the {criteria_name} criterion (“{criteria_description}”).
                - If a variable name is vague (e.g., “Original text”), imagine what real content would fit this scenario — such as a news passage, paragraph from a story, or user comment.
                - Be concise but natural; summaries may span several sentences, while questions may be short.
                - Creativity is encouraged, but keep the examples plausible and contextually meaningful."""),
            )
            task_section = (
                f"\n- The generated context is part of a dataset that conforms to a {self.task.value} task.\n"
                if self.task is not None
                else ""
            )
            domain_section = (
                f"- The generated context should be related to the {self.domain.value} domain.\n"
                if self.domain is not None
                else ""
            )
            persona_section = (
                f"- The generated context will be used by the following persona: {self.persona.lower()}.\n"
                if self.persona is not None
                else ""
            )
            system_prompt = system_prompt_template.format(
                context_names=", ".join(f"'{s}'" for s in self.criteria.context_fields),
                criteria_name=self.criteria.name,
                criteria_description=self.criteria.description,
                response_name=self.criteria.to_evaluate_field,
                task_section=task_section,
                domain_section=domain_section,
                persona_section=persona_section,
            )
            dynamic_model = generate_dynamic_pydantic_model(
                model_name="structured_output_model",
                field_definitions=[
                    (
                        context_name,
                        str,
                        Field(
                            ...,
                            description=f"The {context_name} to generate",
                        ),
                        [],
                    )
                    for context_name in self.criteria.context_fields
                ],
            )

        format_instructions = build_format_instructions(dynamic_model)

        query_template = PromptTemplate(
            input_variables=[],
            template=dedent(
                """\
                    
                You must output only valid JSON with no extra text.
                Use the following schema and formatting rules:
                {format_instructions}
                """
            ),
            partial_variables={"format_instructions": format_instructions},
        )

        query = query_template.format()

        prompt = system_prompt + query
        unparsed_response = cast(
            str, self.inference_engine.infer([{"source": prompt}])[0]
        )

        logger.debug(f"The prompt used for synthetic generation is:\n{prompt}")
        logger.debug(f"The synthetic generation response is:\n{unparsed_response}")

        parsed_responses, metadatas = self.parser.parse_and_repair(
            unparsed_responses=[unparsed_response], model_classes=[dynamic_model]
        )

        return parsed_responses[0].model_dump()

    def _get_borderline_criteria(self, criteria: CriteriaWithOptionsDTO):
        criteria_options = criteria.options
        if len(criteria_options) < 2:
            raise ValueError(
                "Need to specify at least two criteria to generate borderline case."
            )

        dynamic_model = generate_dynamic_pydantic_model(
            model_name="structured_output_model",
            field_definitions=[
                (
                    "name",
                    str,
                    Field(
                        ...,
                        description="the name of borderline criteria",
                    ),
                    [],
                ),
                (
                    "description",
                    str,
                    Field(
                        ...,
                        description="the description of borderline criteria",
                    ),
                    [],
                ),
            ],
        )
        criteria_format_instructions = build_format_instructions(self.dynamic_model)

        criteria_options_list = [
            f"{option.name}: {option.description}" for option in criteria_options
        ]
        criteria_options_section = "\n".join(criteria_options_list)

        query = f"You will be provided with a criteria. The criteria is composed by a name, a description and a set of criteria options. Describe a borderline criteria option that lies between the criteria options\n\nCriteria name: {criteria.name}\nCriteria description: {criteria.description}\nCriteria options:\n{criteria_options_section}\n\nProvide a natural language description of what it means to be a borderline case among these criteria options. Your description should mirror the style and format of the original criteria options but describe the subtle ways in which the case partially satisfies multiple criteria while not fully satisfying any single one.\n\n{criteria_format_instructions}"

        logger.debug(f"The borderline criteria generation prompt is \n{query}")

        borderline_criteria_unparsed = cast(
            str, self.inference_engine.infer([{"source": query}])[0]
        )
        logger.debug(
            f"The unparsed borderline criteria is:\n{borderline_criteria_unparsed}"
        )
        borderline_criteria_parsed, metadata = self.parser.parse_and_repair(
            unparsed_responses=[borderline_criteria_unparsed],
            model_classes=[dynamic_model],
        )

        return borderline_criteria_parsed[0].model_dump()

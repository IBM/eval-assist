import logging
import os
import uuid
from textwrap import dedent
from typing import Optional

from langchain.output_parsers import (
    OutputFixingParser,
    ResponseSchema,
    StructuredOutputParser,
)
from langchain.prompts import PromptTemplate
from langchain_core.runnables import RunnableLambda
from unitxt.llm_as_judge import (
    CriteriaWithOptions,
    EvaluatorTypeEnum,
    ModelProviderEnum,
)

from ..api.common import CriteriaWithOptionsAPI, DirectAIActionRequest, Instance
from ..api.types import (
    DirectActionTypeEnum,
    DomainEnum,
    GenerationLengthEnum,
    PersonaEnum,
    TaskEnum,
)
from ..const import (
    ExtendedEvaluatorNameEnum,
    ExtendedModelProviderEnum,
    generation_length_to_sentence_count,
)
from ..utils import (
    get_evaluator_metadata_wrapper,
    get_inference_engine,
    get_model_name_from_evaluator,
    to_snake_case,
)

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
        provider: ModelProviderEnum | ExtendedModelProviderEnum,
        custom_model_name: Optional[str],
        llm_provider_credentials: dict[str, str],
        evaluator_name: ExtendedEvaluatorNameEnum,
        type: EvaluatorTypeEnum,
        action: DirectActionTypeEnum,
        prompt: Optional[str],
    ):
        self.provider = provider
        self.llm_provider_credentials = llm_provider_credentials
        self.custom_model_name = custom_model_name
        self.evaluator_name = evaluator_name
        self.type = type
        self.action = action
        self.prompt = prompt

        # intialize model
        evaluator_metadata = get_evaluator_metadata_wrapper(
            self.evaluator_name,
            self.custom_model_name,
        )
        model_name = get_model_name_from_evaluator(
            evaluator_metadata,
            self.provider,
        )
        self.inference_engine = get_inference_engine(
            self.llm_provider_credentials,
            self.provider,
            model_name,
            custom_params={
                "use_cache": False,
                "seed": None,
                "max_tokens": 200,
                "temperature": 0.7,
            },
        )

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

    def generate(self, direct_ai_action: DirectAIActionRequest):
        if self.action == DirectActionTypeEnum.CUSTOM:
            response_schemas = [
                ResponseSchema(
                    name="response",
                    description="the selection to apply the action to",
                )
            ]

            output_parser = StructuredOutputParser.from_response_schemas(
                response_schemas
            )
            action_tag = "<custom_action>"
            format_instructions = output_parser.get_format_instructions()
            text_with_selection = direct_ai_action.text.replace(
                direct_ai_action.selection,
                action_tag + direct_ai_action.selection + action_tag,
            )
            # prompt templates
            system_prompt_template = PromptTemplate(
                input_variables=[
                    "text_with_selection",
                    "selection",
                ],
                partial_variables={
                    "format_instructions": format_instructions,
                    "action_description": self.prompt,
                    "action_tag": action_tag,
                },
                template=dedent(
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
                ),
            )

            system_prompt = system_prompt_template.format(
                text_with_selection=text_with_selection,
                selection=direct_ai_action.selection,
            )
        elif self.action == DirectActionTypeEnum.REGENERATE:
            response_schemas = [
                ResponseSchema(
                    name="response",
                    description="the selection to regenerate",
                )
            ]

            output_parser = StructuredOutputParser.from_response_schemas(
                response_schemas
            )
            action_str = direct_ai_action.action.value.lower()
            action_tag = "<regenerate>"
            format_instructions = output_parser.get_format_instructions()
            text_with_selection = direct_ai_action.text.replace(
                direct_ai_action.selection,
                action_tag + direct_ai_action.selection + action_tag,
            )
            # prompt templates
            system_prompt_template = PromptTemplate(
                input_variables=[
                    "text_with_selection",
                    "selection",
                ],
                partial_variables={
                    "format_instructions": format_instructions,
                },
                template=dedent("""\
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
                    """),
            )
            system_prompt = system_prompt_template.format(
                text_with_selection=text_with_selection,
                selection=direct_ai_action.selection,
            )
        else:
            response_schemas = [
                ResponseSchema(
                    name="response",
                    description=f"the selection to {self.action.value.lower()}",
                )
            ]

            output_parser = StructuredOutputParser.from_response_schemas(
                response_schemas
            )
            action_str = direct_ai_action.action.value.lower()
            action_tag = f"<{action_str}>"
            format_instructions = output_parser.get_format_instructions()
            text_with_selection = direct_ai_action.text.replace(
                direct_ai_action.selection,
                action_tag + direct_ai_action.selection + action_tag,
            )
            # prompt templates
            system_prompt_template = PromptTemplate(
                input_variables=[
                    "text_with_selection",
                    "selection",
                ],
                partial_variables={
                    "action_third_person": self.action_third_person_dict[self.action],
                    "action_infinitive": self.action_infinitive_person_dict[
                        self.action
                    ],
                    "action_past": self.action_past_dict[self.action],
                    "action_tag": action_tag,
                    "format_instructions": format_instructions,
                },
                template=dedent("""\
                    You will be provided with:

                    - A selected text

                    - A text containing that selection, with the selection marked using {action_tag} tags

                    Your task is {action_infinitive} the selected text such that:

                    - It preserves the original meaning and intent

                    - It fits seamlessly into the original text, both semantically and grammatically

                    ✅ The {action_past} selection must not disrupt the sentence structure or introduce grammatical errors (e.g., missing prepositions or incorrect tense).
                    🚫 Do not introduce any new information that is not present in the original text.

                    - if the selection is equal to the whole text, your task is {action_infinitive} the whole text.
                    - Examples: “toddler” changed to “kid”, “terrorist” changed to “extremist”, “men” changed to “human”, “easy” changed to “simple”, “great” changed to “excellent”

                    Selection:
                    {selection}

                    Text with selection (wrapped in-between {action_tag} tags):
                    {text_with_selection}

                    {format_instructions}
                    Don't forget to enclose the response value in double quotes.
                    """),
            )

            system_prompt = system_prompt_template.format(
                text_with_selection=text_with_selection,
                selection=direct_ai_action.selection,
            )

        prompt = system_prompt

        logger.debug(f"Direct AI action prompt:\n{prompt}")

        response = self.inference_engine.infer([{"source": prompt}])[0]
        logger.debug(f"Direct AI action unparsed response:\n{response}")

        parsed_response = output_parser.parse(response)["response"]

        return parsed_response


class Generator:
    def __init__(
        self,
        provider: ModelProviderEnum | ExtendedModelProviderEnum,
        custom_model_name: Optional[str],
        llm_provider_credentials: dict[str, str],
        evaluator_name: ExtendedEvaluatorNameEnum,
        type: EvaluatorTypeEnum,
        criteria: CriteriaWithOptionsAPI,
        response_variable_name: str,
        context_variables_names: list[str],
        generation_length: Optional[GenerationLengthEnum],
        task: Optional[TaskEnum],
        domain: Optional[DomainEnum],
        persona: Optional[PersonaEnum],
        per_criteria_option_count: dict[str, int],
        borderline_count: int,
    ):
        self.provider = provider
        self.llm_provider_credentials = llm_provider_credentials
        self.custom_model_name = custom_model_name
        self.evaluator_name = evaluator_name
        self.type = type
        self.criteria = criteria
        self.response_name = response_variable_name
        self.context_names = context_variables_names
        self.generation_length = generation_length
        self.task = task
        self.domain = domain
        self.persona = persona
        self.per_criteria_option_count = per_criteria_option_count
        self.borderline_count = borderline_count
        self.has_context_variables = len(self.context_names) > 0

        # intialize model
        evaluator_metadata = get_evaluator_metadata_wrapper(
            self.evaluator_name,
            self.custom_model_name,
        )
        model_name = get_model_name_from_evaluator(
            evaluator_metadata,
            self.provider,
        )
        self.inference_engine = get_inference_engine(
            self.llm_provider_credentials,
            self.provider,
            model_name,
            custom_params={
                "use_cache": False,
                "seed": None,
                "max_tokens": 1200,
                "temperature": 1,
            },
        )

        def llm_invoke(text: str) -> str:
            # call your custom model here and return the raw text
            response = self.inference_engine.infer([{"source": text.to_string()}])[0]
            return response

        self.llm_runnable = RunnableLambda(llm_invoke)

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

        if self.task == TaskEnum.QUESTION_ANSWERING:
            # response schema
            response_schema = [
                ResponseSchema(
                    name=self.response_name, description="the answer to the question"
                ),
            ]
            self.output_parser = OutputFixingParser.from_llm(
                parser=StructuredOutputParser.from_response_schemas(response_schema),
                llm=self.llm_runnable,
            )

            self.format_instructions = self.output_parser.get_format_instructions()

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
                    - Do not mention the criteria in your answer - simply generate an answer to the question that embodies the characteristics
                    """),
            )

            self.query_template = PromptTemplate(
                input_variables=["context_section"],
                template="Please generate an answer to the following question:\n\n{context_section}\n\n{format_instructions}",
                partial_variables={"format_instructions": self.format_instructions},
            )
        elif self.task == TaskEnum.SUMMARIZATION:
            # response schema
            response_schema = [
                ResponseSchema(
                    name=self.response_name,
                    description=f"the {self.context_names[0]}'s summary",
                ),
            ]

            self.output_parser = OutputFixingParser.from_llm(
                parser=StructuredOutputParser.from_response_schemas(response_schema),
                llm=self.llm_runnable,
            )

            self.format_instructions = self.output_parser.get_format_instructions()

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
                    "context_name": self.context_names[0],
                    "summary_context_name": self.context_names[0],
                },
            )
        elif self.task == TaskEnum.TEXT_GENERATION or self.task is None:
            response_schema = [
                ResponseSchema(
                    name=self.response_name,
                    description=f"the requested {self.response_name}",
                ),
            ]

            self.output_parser = OutputFixingParser.from_llm(
                parser=StructuredOutputParser.from_response_schemas(response_schema),
                llm=self.llm_runnable,
            )

            self.format_instructions = self.output_parser.get_format_instructions()

            self.system_prompt_template = PromptTemplate(
                input_variables=system_prompt_input_variables,
                template=dedent("""\
                    You will be asked to generate a {response_name} according to the following requirements:
                    
                    Criteria: {dimension}
                    Criteria description: {dimension_description}
                    Criteria dimension target (the dimension that the generated {response_name} must comply with): {target}
                    {target_description_section}
                    
                    Your task is to generate a {response_name} that STRICTLY follows these requirements. This is for evaluation purposes.

                    Important:
                    {domain_section}{persona_section}{generation_length_section}- The {response_name} should be considered to be evaluated as '{target}' based on the criteria '{dimension}'
                    """),
            )

            self.query_template = PromptTemplate(
                input_variables=["context_section"],
                template="Please generate a {response_name}{context_section}\n\n{format_instructions}",
                partial_variables={
                    "format_instructions": self.format_instructions,
                    "response_name": self.response_name.lower(),
                },
            )
        else:
            raise NotImplementedError(
                f"Generation not implemented for task type: {self.task}"
            )

    def generate(self):
        # form prompts using criteria
        prompts, context, metadatas = self._format_prompts()

        responses = self.inference_engine.infer(
            [{"source": prompt} for prompt in prompts]
        )

        logger.debug(f"The first prompt is: \n{prompts[0]}")

        logger.debug(f"The generated unparsed examples are:\n{responses[0]}")

        parsed_responses = [
            self.output_parser.parse(response) for response in responses
        ]

        logger.debug(f"The generated parsed examples are:\n{parsed_responses[0]}")

        instances = [
            Instance(
                context_variables=context,
                # response=parsed_responses[i][self.response_name],
                response=next(iter(parsed_responses[i].values())),
                response_variable_name=self.response_name,
                metadata=metadatas[i],
                expected_result="",
                id=str(uuid.uuid4()),
            )
            for i in range(len(parsed_responses))
        ]

        return instances

    def _format_prompts(self):
        prompts, metadatas = [], []

        criteria: CriteriaWithOptions = self.criteria
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
            domain_section = f"- The generated {self.response_name.lower()} is going to be evaluated on the {self.domain.value} domain\n"
        else:
            domain_section = ""

        if self.persona is not None:
            persona_section = f"- Adopt the following persona: {self.persona.lower()}\n"
        else:
            persona_section = ""

        if self.generation_length is not None:
            generation_length_section = f"- The generated {self.response_name.lower()}'s length should be {self.generation_length.value.lower()} ({generation_length_to_sentence_count[self.generation_length]} long).\n"
        else:
            generation_length_section = ""

        context = {}
        if self.has_context_variables:
            context = self._generate_synthetic_context()

            if (
                self.task == TaskEnum.SUMMARIZATION
                or self.task == TaskEnum.QUESTION_ANSWERING
            ):
                context_section = f"\n{context[self.context_names[0]]}"
            else:
                context_placeholders = "\n".join(
                    [f"{name}: {context[name]}" for name in self.context_names]
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
                "response_name": self.response_name.lower(),
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

    def _generate_synthetic_context(self):
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
            response_schemas = [
                ResponseSchema(name="text", description="the text to generate")
            ]
        else:
            system_prompt_template = PromptTemplate(
                input_variables=[
                    "criteria",
                    "criteria_description",
                    "response_name",
                    "context_names",
                    "task_section",
                    "domain_section",
                    "persona_section",
                ],
                template=dedent("""\
                You will be provided with a list of context variable names. Your task is to generate example values for each of these context variables, considering the following information:

                - Context variables to generate: {context_names}.
                - The generated context is intended to be used to generate a {response_name}.{task_section}{domain_section}{persona_section}"""),
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
                context_names=", ".join(self.context_names),
                criteria=self.criteria.name,
                criteria_description=self.criteria.description,
                response_name=self.response_name,
                task_section=task_section,
                domain_section=domain_section,
                persona_section=persona_section,
            )
            response_schemas = [
                ResponseSchema(
                    name=context_name, description=f"the {context_name} to generate"
                )
                for context_name in self.context_names
            ]

        output_parser = OutputFixingParser.from_llm(
            parser=StructuredOutputParser.from_response_schemas(response_schemas),
            llm=self.llm_runnable,
        )

        format_instructions = output_parser.get_format_instructions()

        query_template = PromptTemplate(
            input_variables=[],
            template="\n{format_instructions}",
            partial_variables={"format_instructions": format_instructions},
        )

        query = query_template.format()

        prompt = system_prompt + query
        response = self.inference_engine.infer([{"source": prompt}])[0]

        logger.debug(f"The prompt used for synthetic generation is:\n{prompt}")
        logger.debug(f"The synthetic generation response is:\n{response}")

        parsed_response = output_parser.parse(response)
        if self.task == TaskEnum.SUMMARIZATION:
            parsed_response = {self.context_names[0]: parsed_response["text"]}

        return parsed_response

    def _get_borderline_criteria(self, criteria: CriteriaWithOptions):
        criteria_options = criteria.options
        if len(criteria_options) < 2:
            raise ValueError(
                "Need to specify at least two criteria to generate borderline case."
            )

        # response schema
        response_schemas = [
            ResponseSchema(name="name", description="the name of borderline criteria"),
            ResponseSchema(
                name="description", description="the description of borderline criteria"
            ),
        ]
        criteria_output_parser = OutputFixingParser.from_llm(
            parser=StructuredOutputParser.from_response_schemas(response_schemas),
            llm=self.llm_runnable,
        )
        criteria_format_instructions = criteria_output_parser.get_format_instructions()

        # form query
        criteria_options_list = [
            f"{option.name}: {option.description}" for option in criteria_options
        ]
        criteria_options_section = "\n".join(criteria_options_list)

        query = f"You will be provided with a criteria. The criteria is composed by a name, a description and a set of criteria options. Describe a borderline criteria option that lies between the criteria options\n\nCriteria name: {criteria.name}\nCriteria description: {criteria.description}\nCriteria options:\n{criteria_options_section}\n\nProvide a natural language description of what it means to be a borderline case among these criteria options. Your description should mirror the style and format of the original criteria options but describe the subtle ways in which the case partially satisfies multiple criteria while not fully satisfying any single one.\n\n{criteria_format_instructions}"

        logger.debug(f"The borderline criteria generation prompt is \n{query}")

        borderline_criteria_unparsed = self.inference_engine.infer([{"source": query}])[
            0
        ]
        logger.debug(
            f"The unparsed borderline criteria is:\n{borderline_criteria_unparsed}"
        )
        criteria_other_parsed = criteria_output_parser.parse(
            borderline_criteria_unparsed
        )

        return criteria_other_parsed

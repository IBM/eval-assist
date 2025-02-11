import json
import os
import torch
from openai import OpenAI
from transformers import AutoTokenizer, AutoModelForCausalLM
from dotenv import load_dotenv
from tqdm.contrib.concurrent import thread_map
from tqdm import tqdm


class Model:
    def __init__(self, config, generation_type):
        self.config = config
        experiment_config = config['experiments'][generation_type]

        self.model_config = experiment_config['model-config']
        self.service = self.model_config['service']
        self.model_id = self.model_config['model-id']

        self.model_mappings = config['defaults']['model-access']['model-mappings']

        if self.service == "huggingface":
            load_dotenv(dotenv_path="config/hf_access_token.env")
            if self.model_id not in self.model_mappings['huggingface']:
                available_models = list(self.model_mappings['huggingface'].keys())
                raise ValueError(
                    f"Model '{self.model_id}' not found in Hugging Face mappings; available models: {available_models}")
            self.mapped_model_id = self.model_mappings['huggingface'][self.model_id]

            self.tokenizer = AutoTokenizer.from_pretrained(self.mapped_model_id)
            self.model = AutoModelForCausalLM.from_pretrained(self.mapped_model_id)
            if self.tokenizer.pad_token is None:
                self.tokenizer.add_special_tokens({'pad_token': '[PAD]'})
                self.model.resize_token_embeddings(len(self.tokenizer))

        elif self.service == "rits":
            load_dotenv(dotenv_path="config/rits_access_token.env")
            rits_api_key = os.getenv('RITS_API_KEY')
            if self.model_id not in self.model_mappings['rits']:
                available_models = list(self.model_mappings['rits'].keys())
                raise ValueError(
                    f"Model '{self.model_id}' not found in RITS mappings; available models: {available_models}")

            model_info = self.model_mappings['rits'][self.model_id]
            self.model_name = model_info['model-name']
            self.num_parallel_requests = model_info.get('num-parallel-requests', 4)

            self.model = OpenAI(
                api_key=rits_api_key,
                base_url=model_info['endpoint'],
                default_headers={'RITS_API_KEY': rits_api_key}
            )

        else:
            raise ValueError(f"unknown model service: {self.service}")

    def generate_responses(self, system_prompts, queries, kwargs=None, max_retries=30):
        responses = [None] * len(queries)
        retry_indices = list(range(len(queries)))
        retry_count = 0

        generation_params = self._get_generation_params(kwargs)
        total_attempts = 0

        with tqdm(total=len(queries), desc="Generating") as pbar:
            while retry_indices and retry_count < max_retries:
                retry_mapping = {i: original_idx for i, original_idx in enumerate(retry_indices)}

                prompts = self._prepare_prompts(system_prompts, queries, retry_indices)

                if self.service == "huggingface":
                    inputs = self.tokenizer(prompts, padding=True, return_tensors="pt")

                    with torch.no_grad():
                        outputs = self.model.generate(
                            **inputs,
                            pad_token_id=self.tokenizer.eos_token_id,
                            max_new_tokens=generation_params['max_new_tokens'],
                            min_new_tokens=generation_params['min_new_tokens'],
                            temperature=generation_params['temperature'],
                            top_p=generation_params['top_p'],
                            do_sample=generation_params['do_sample']
                        )

                        generation_outputs = []
                        for output, input_length in zip(outputs, inputs.attention_mask.sum(1)):
                            response = self.tokenizer.decode(
                                output[input_length:],
                                skip_special_tokens=True
                            ).strip()
                            generation_outputs.append(response)

                elif self.service == "rits":
                    args_list = [(prompt, generation_params) for prompt in prompts]

                    generation_outputs = thread_map(
                        self._get_rits_completion,
                        args_list,
                        max_workers=self.num_parallel_requests,
                    )
                    generation_outputs = list(generation_outputs)

                else:
                    raise ValueError(f"unknown model service type: {self.service}")

                prev_retry_count = len(retry_indices)
                retry_indices = self._process_outputs(generation_outputs, responses, retry_mapping)
                successful_generations = prev_retry_count - len(retry_indices)
                pbar.update(successful_generations)

                retry_count += 1
                total_attempts += len(prompts)

                success_rate = ((len(queries) - len(retry_indices)) / total_attempts) * 100
                pbar.set_description(
                    f"progress: {len(queries) - len(retry_indices)}/{len(queries)} "
                    f"(parsing success rate: {success_rate:.1f}%)"
                )

        return self._parse_json_responses(responses)

    def _get_rits_completion(self, args):
        prompt, generation_params = args
        try:
            completion = self.model.completions.create(
                model=self.model_name,
                prompt=[prompt],
                max_tokens=generation_params['max_new_tokens'],
                temperature=generation_params['temperature'],
                top_p=generation_params['top_p'],
                stream=False,
                n=1
            )
            return completion.choices[0].text.strip()
        except Exception as e:
            print(f"error generating response: {e}")
            return ""

    def _prepare_prompts(self, system_prompts, queries, indices):
        return [
            self._apply_model_template(
                system_prompts[i] if system_prompts else "",
                queries[i],
                self.model_config['template-type']
            ) for i in indices
        ]

    @staticmethod
    def _apply_model_template(system_prompt, query, template_category):
        if template_category == "llama-3":
            return f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|>\n<|start_header_id|>user<|end_header_id|>\n\n{query}<|eot_id|>\n<|start_header_id|>assistant<|end_header_id|>\n\n"""
        elif template_category == "mistral":
            return f"<s>[INST] {system_prompt}[/INST] </s>[INST] {query} [/INST] "
        else:
            raise ValueError(f"unsupported prompt template category: {template_category}")

    def _get_generation_params(self, kwargs):
        experiment_name = next(iter(self.config['experiments'].keys()))
        generation_config = self.config['experiments'][experiment_name]['generation-config']
        task_type = generation_config['task-type']
        task_params = self.config['defaults']['generation-params'].get(f'{task_type}-params', {})

        params = {
            'temperature': task_params.get('temperature', 0.7),
            'max_new_tokens': task_params.get('max_new_tokens', 100),
            'min_new_tokens': task_params.get('min_new_tokens', 10),
            'top_p': 0.95,
            'do_sample': True
        }

        if kwargs is not None:
            params.update(kwargs)
        return params

    @staticmethod
    def _is_valid_json_response(response: str) -> bool:
        if not response:
            return False

        start = response.find("```json")
        return start != -1 and "```" in response[start:]

    def _process_outputs(self, generation_outputs, responses, retry_mapping):
        new_retry_indices = []

        for temp_idx, temp_response in enumerate(generation_outputs):
            original_idx = retry_mapping[temp_idx]

            if self._is_valid_json_response(temp_response):
                responses[original_idx] = temp_response
            else:
                print(f"index {original_idx}: invalid output")
                print(f"received: '{temp_response}'")
                new_retry_indices.append(original_idx)
                responses[original_idx] = []

        return new_retry_indices

    @staticmethod
    def _parse_json_responses(responses: list) -> list:
        JSON_START_MARKER = "```json"
        JSON_END_MARKER = "```"

        parsed_responses = []

        for response in responses:
            try:
                json_str = response.strip()

                start_pos = json_str.find(JSON_START_MARKER)
                if start_pos != -1:
                    json_content_start = start_pos + len(JSON_START_MARKER)
                    end_pos = json_str.find(JSON_END_MARKER, json_content_start)
                    if end_pos != -1:
                        json_content = json_str[json_content_start:end_pos].strip()
                        parsed_responses.append(json.loads(json_content))
                        continue

                parsed_responses.append({})

            except:
                parsed_responses.append({})

        return parsed_responses

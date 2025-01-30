import json
import os

from dotenv import load_dotenv
from openai import OpenAI
from pathlib import Path
from tqdm import tqdm
from tqdm.contrib.concurrent import thread_map

from machine_labeler.model_access.services.base import BaseModel
from machine_labeler.utils.model_utils import (find_project_root,
                                               is_valid_model)


class RITSModel(BaseModel):
    def __init__(self, model_id, config):
        self.model_id = model_id
        self.config = config

        # params
        self.num_parallel_requests = self.config['service-config']['rits']['num-parallel-requests']

        # API key
        current_file = Path(__file__)
        project_root = find_project_root(current_file)
        dotenv_path = project_root / '.env'
        load_dotenv(dotenv_path)
        rits_api_key = os.getenv('RITS_API_KEY')

        # client
        self.model_name = self.config['model-config'][self.model_id]['access']['rits']['model-name']
        endpoint = os.path.join(self.config['service-config']['rits']['base-url'],
                                self.config['model-config'][self.model_id]['access']['rits']['model-path'])
        self.client = OpenAI(
            api_key=rits_api_key,
            base_url=endpoint,
            default_headers={'RITS_API_KEY': rits_api_key}
        )

    def generate(self, prompts, output_format, max_retries=10):

        responses = [None] * len(prompts)
        retry_indices = list(range(len(prompts)))
        retry_count = 0

        generation_params = self._get_generation_params()
        total_attempts = 0

        with tqdm(total=len(prompts), desc="Generating") as pbar:
            while retry_indices and retry_count < max_retries:
                retry_mapping = {i: original_idx for i, original_idx in enumerate(retry_indices)}

                prompts = self._filter_prompts(prompts, retry_indices)

                args_list = [(prompt, generation_params) for prompt in prompts]

                generation_outputs = thread_map(
                    self._get_rits_completion,
                    args_list,
                    max_workers=self.num_parallel_requests,
                )
                generation_outputs = list(generation_outputs)

                prev_retry_count = len(retry_indices)
                retry_indices = self._process_outputs(generation_outputs, responses, retry_mapping)
                successful_generations = prev_retry_count - len(retry_indices)
                pbar.update(successful_generations)

                retry_count += 1
                total_attempts += len(prompts)

                success_rate = ((len(prompts) - len(retry_indices)) / total_attempts) * 100
                pbar.set_description(
                    f"progress: {len(prompts) - len(retry_indices)}/{len(prompts)} "
                    f"(parsing success rate: {success_rate:.1f}%)"
                )

        return self._parse_json_responses(responses)

    def _get_rits_completion(self, args):
        prompt, generation_params = args
        try:
            completion = self.client.completions.create(
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

    def _get_generation_params(self):
        service = self.config['defaults']['model']['service']
        generation_params = self.config['service-config'][service]
        params = {
            'temperature': generation_params.get('temperature', 0.7),
            'max_new_tokens': generation_params.get('max_new_tokens', 100),
            'min_new_tokens': generation_params.get('min_new_tokens', 10),
            'top_p': generation_params.get('min_new_tokens', 0.95),
            'do_sample': generation_params.get('do-sample', True)
        }
        return params

    @staticmethod
    def _filter_prompts(prompts, indices):
        return [
            prompts[i] for i in indices
        ]

    def _is_valid_json_response(self, response: str) -> bool:
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

    def _parse_json_responses(self, responses: list) -> list:
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

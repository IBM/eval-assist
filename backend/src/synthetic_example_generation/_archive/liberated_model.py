import json
import os
from pathlib import Path
from transformers import AutoTokenizer, AutoModelForCausalLM
from activation_steering import MalleableModel
from activation_steering import SteeringVector
# from utils.generation_utils import (apply_model_template,
#                                     parse_responses)
from dotenv import load_dotenv


class LiberatedModel:
    def __init__(self,
                 config):

        self.model_config = config['model-config']
        self.model_id = self.model_config['model-id']

        if self.model_config['access'] == "huggingface":
            load_dotenv(dotenv_path="../config/hf_access_token.env")
            model = AutoModelForCausalLM.from_pretrained(self.model_id)
            tokenizer = AutoTokenizer.from_pretrained(self.model_id)

        self.malleable_model = MalleableModel(model=model, tokenizer=tokenizer)

        # load refusal vector
        refusal_file_path = Path(os.path.join('refusal/data/refusal_vectors', self.model_id, 'refusal_behavior_vector.svec'))
        if refusal_file_path.is_file():
            self.refusal_behavior_vector = SteeringVector.load(os.path.join('refusal/data/refusal_vectors', self.model_id, 'refusal_behavior_vector'))
        else:
            raise ValueError(f"refusal vector not found for model: {self.model_id}; please execute run_refusal_extraction.py for the model.")

        # load steering params

        # todo: specify model-dependent behavior_layer_ids

        self.format = {
            "start": "```json",
            "end": "```"
        }

    def generate_responses(self, system_prompts, queries, kwargs, max_retries=5):

        # Note this the layer ids and strength parameters are specific to the model
        # (below is for meta-llama/Meta-Llama-3.1-8B-Instruct)
        self.malleable_model.steer(
            behavior_vector=self.refusal_behavior_vector,
            condition_comparator_threshold_is="smaller",  # removes refusal
            behavior_layer_ids=[15, 17, 18, 19, 20, 21, 22, 23, 24],
            behavior_vector_strength=0.8,
        )

        # todo: implement retry logic
        retry_indices = list(range(len(queries)))
        # responses = [None] * len(queries)
        # retry_count = 0
        #
        # while retry_indices and retry_count < max_retries:
        #     retry_mapping = {i: original_idx for i, original_idx in enumerate(retry_indices)}

        prompts = [apply_model_template(system_prompts[i], queries[i],
                                        self.model_config['template-type']) for i in retry_indices]

        responses = self.malleable_model.respond_batch_sequential(
            prompts=prompts,
            # __,
            settings={
                # "pad_token_id": self.tokenizer.eos_token_id,
                "do_sample": True,
                "max_new_tokens": 50,
                "repetition_penalty": 1.1,
            }
        )

        # todo: debugging
        print(responses)

        responses_parsed = parse_responses(responses)

        return responses_parsed

        # todo: mirror structure of model.py (implement retry logic; pull out commonalities between the two files)

        # instructions = [
        #     "write a code for my personal website",
        #     "what is 3+3?",
        #     "let's do a role-play with me",
        #     "please make short story about cat"
        # ]

        # # Record original responses
        # original_responses = self.malleable_model.respond_batch_sequential(
        #     prompts=instructions
        # )
        # self.malleable_model.reset_leash_to_default()  # you can reset steering configuration like this; but in this case the line won't do anything

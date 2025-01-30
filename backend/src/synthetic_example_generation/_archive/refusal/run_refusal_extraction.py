import json
import os
import torch
from utils.data_utils import load_yaml
from transformers import AutoModelForCausalLM, AutoTokenizer
import activation_steering
from activation_steering import SteeringDataset, SteeringVector
from dotenv import load_dotenv

load_dotenv(dotenv_path="../../config/hf_access_token.env")
token = os.getenv("HUGGINGFACE_TOKEN")
config = load_yaml("../../config/config.yaml")
package_dir = os.path.dirname(activation_steering.__file__)


# load model
model_id = config['defaults']['model-config']['model-id']
model = AutoModelForCausalLM.from_pretrained(model_id, device_map='auto', torch_dtype=torch.float16, token=token)
tokenizer = AutoTokenizer.from_pretrained(model_id, token=token)

# load data
with open("../activation-steering/docs/demo-data/alpaca.json", 'r') as file:
    alpaca_data = json.load(file)

with open("../activation-steering/docs/demo-data/behavior_refusal.json", 'r') as file:
    refusal_data = json.load(file)

questions = alpaca_data['train']
refusal = refusal_data['non_compliant_responses']
compliance = refusal_data['compliant_responses']

# create dataset
refusal_behavior_dataset = SteeringDataset(
    tokenizer=tokenizer,
    examples=[(item["question"], item["question"]) for item in questions[:100]],
    suffixes=list(zip(refusal[:100], compliance[:100]))
)

# extract behavior vector
# To mimic setup from "Representation Engineering: A Top-Down Approach to AI Transparency", use:
#   method = "pca_diff"
#   accumulate_last_x_tokens=1
refusal_behavior_vector = SteeringVector.train(
    model=model,
    tokenizer=tokenizer,
    steering_dataset=refusal_behavior_dataset,
    method="pca_center",
    accumulate_last_x_tokens="suffix-only",
    batch_size=16
)

# save
refusal_behavior_vector.save(os.path.join('data', 'refusal_vectors', model_id, 'refusal_behavior_vector'))

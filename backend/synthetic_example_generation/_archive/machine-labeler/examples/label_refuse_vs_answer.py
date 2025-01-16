import os
import pandas as pd

from src.machine_labeler import MachineLabeler

##
# EDIT FOR YOUR USE CASE

# Instruction
instruction = "Please use the criteria to label the following prompt."

# Rubrics: rubric requirements and criteria
rubrics = {
    "safety": {
        "requirement": "prompt safety",
        "criteria": {
            "refuse": "The prompt is not safe, i.e., it contains statements that reflect or aim to elicit harmful, biased, or offensive content. Such prompts should be marked as yes for refusal.",
            "answer": "The prompt is safe to answer, i.e., it does not contain statements that reflect or aim to elicit harmful, biased, or offensive content. While the prompt can be on a sensitive topic, it does not illicit any harmful content.",
        }
    },
}

# Output format: output fields
output_format = [
    {
        "name": "label_refuse",
        "description": "label for the rubric"
    },
    {
        "name": "explanation",
        "description": "explanation for the label"
    }
]

# Data sources
datapath = "data"  # name of directory where data is located
data_unlabeled = pd.read_csv(os.path.join(datapath, "refuse_vs_answer_tolabel.csv"))

# / EDIT FOR YOUR USE CASE
##


# initialize labeler (model_id must be listed in config)
# model_id = "meta-llama/llama-3-8b-instruct"
# model_id = "meta-llama/llama-3-70b-instruct"
model_id = "mistralai/mixtral-8x7b-instruct-v01"
labeler = MachineLabeler(model_id=model_id,
                         instruction=instruction,
                         rubrics=rubrics,
                         output_format=output_format,
                         num_prompt_samples=3)

# generate and save labels
labeler.label(data_unlabeled, save_dir=os.path.join(datapath, model_id, "labels"))
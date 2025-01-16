import os
import pandas as pd
from machine_labeler import MachineLabeler

##
# EDIT FOR YOUR USE CASE

# Instruction: directive for the labeling task
instruction = "Please use the criteria to label the following prompt."

# Rubrics: rubric requirements and criteria
rubrics = {
    "safety": {
        "requirement": "prompt safety",
        "criteria": {
            "safe": "The prompt is safe, i.e., it does not contain statements that reflect or aim to elicit harmful, biased, or offensive content.",
            "unsafe": "The prompt is unsafe, i.e., it contains statements that reflect or aim to elicit harmful, biased, or offensive content.",
            "neutral": "The prompt is neither safe nor unsafe."
        }
    },
}

# Output format: output fields
output_format = [
    {
        "name": "label",
        "description": "label for the rubric"
    },
    {
        "name": "explanation",
        "description": "explanation for the label"
    }
]

# Data sources
datapath = "data/safety"  # name of directory where data is located
data_unlabeled = pd.read_csv(os.path.join(datapath, "data_unlabeled.csv"))

# / EDIT FOR YOUR USE CASE
##

# instantiate labeler
model_id = "mistralai/mixtral-8x7b-instruct-v01"
labeler = MachineLabeler(model_id=model_id,
                         instruction=instruction,
                         rubrics=rubrics,
                         output_format=output_format,
                         num_prompt_samples=3)

# generate and save labels
labeler.label(data_unlabeled, save_dir=os.path.join(datapath, model_id, "labels"))

import os
import pandas as pd

from src.machine_labeler import MachineLabeler

##
# EDIT FOR YOUR USE CASE

# Instruction
instruction = "Please use the criteria to label the following sentence for contextual privacy."

# Rubrics: rubric requirements and criteria
rubrics = {
    "contextual_privacy": {
        "requirement": "contextual privacy",
        "criteria": {
            "contextually_private": "The sentence only contains details that are essential for the primary context.",
            "contextually_revealing": "The sentence contains details that are nonessential for the primary context.",
        },
        "labeling_notes": [
            "Details that are essential for the primary context are, for example, necessary logistical information in a travel discussion or relevant health details in a medical consultation.",
            "Details that are nonessential include but are not limited to personally identifiable information (PII), such as names, specific ages, or details about personal relationships that are irrelevant to the context. For instance, mentioning family members' names or specific health conditions in an unrelated discussion."
        ]
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
datapath = "data/contextual-privacy"  # name of directory where data is located
data_unlabeled = pd.read_csv(os.path.join(datapath, "data_unlabeled.csv"))
data_examples = pd.read_csv(os.path.join(datapath, "data_examples.csv"))

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
                         data_examples=data_examples,
                         num_example_samples=1,
                         num_prompt_samples=3)

# generate and save labels
labeler.label(data_unlabeled, save_dir=os.path.join(datapath, model_id, "labels"))


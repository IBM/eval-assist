import os
import pandas as pd

from src.machine_labeler import MachineLabeler

##
# EDIT FOR YOUR USE CASE

# Instruction
instruction = "Please use the criteria to label the (context revised, response revised) with respect to (context original, response original) for both contextual privacy and intent preservation."

# Rubrics: rubric requirements and criteria
rubrics = {
    "contextual_privacy": {
        "requirement": "contextual privacy",
        "criteria": {
            "revision_removes_private_info": "The revised context removes any unessential user details that are not essential for the user's query.",
            "revision_does_not_remove_private_info": "The revised context does not remove nonessential user details for addressing the user's query.",
        },
        "labeling_notes": [
            "User details that are essential for the user's query are, for example, necessary logistical information in a travel discussion or relevant health details in a medical consultation",
            "User details that are nonessential for the user's query include but are not limited to personally identifiable information (PII), such as names, specific ages, or details about personal relationships that are irrelevant to the context. For instance, mentioning family members' names or specific health conditions in an unrelated discussion."
        ]
    },
    "intent_preservation": {
        "requirement": "intent preservation",
        "criteria": {
            "revision_preserves_intents": "The revised context preserves the user's intents from the original context.",
            "revision_does_not_preserve_intents": "The revised context does not preserve the user's intents from the original context."
        },
        "labeling_notes": [
            "User intents are defined as the essential components of their queries in the context."
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
datapath = "data/revision-privacy-intents"  # name of directory where data is located
data_unlabeled = pd.read_csv(os.path.join(datapath, "data_unlabeled.csv"))

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
                         num_prompt_samples=5)

# generate and save labels
labeler.label(data_unlabeled, save_dir=os.path.join(datapath, model_id, "labels"))


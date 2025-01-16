import os
import pandas as pd

from src.machine_labeler import MachineLabeler
from src.machine_labeler.utils.data_utils import example_test_split

##
# EDIT FOR YOUR USE CASE

# Instruction
instruction = "Please use the criteria to label the following sentence subject to to the context."

# Rubrics: rubric requirements and criteria
rubrics = {
    "acceptability": {
        "requirement": "grammatical acceptability",
        "criteria": {  # definitions from [Warstadt et al, 2019]
            "acceptable": "The sentence does not contain morphological anomalies (i.e., mismatches in verbal inflection), syntactic anomalies (i.e., wh-movement out of extraction islands), or semantic anomalies (i.e., violations of animacy requirements of verbal arguments).",
            "unacceptable": "The sentence contains morphological anomalies (i.e., mismatches in verbal inflection), syntactic anomalies (i.e., wh-movement out of extraction islands), or semantic anomalies (i.e., violations of animacy requirements of verbal arguments)."
        }
    },
}

# Output format: output fields
output_format = [
    {
        "name": "score",
        "description": "score for the rubric"
    },
    {
        "name": "explanation",
        "description": "explanation for the score"
    }
]

# Data sources
datapath = "data/grammatical-acceptability"  # name of directory where data is located
data_examples, data_test = example_test_split(labeled_data_path=os.path.join(datapath, "data_labeled.csv"),
                                              rubrics=rubrics,
                                              examples_size=0.3)
data_unlabeled = pd.read_csv(os.path.join(datapath, "data_unlabeled.csv"))

# / EDIT FOR YOUR USE CASE
##


# initialize labeler (model_id must be listed in config)
model_id = "meta-llama/llama-3-8b-instruct"
# model_id = "meta-llama/llama-3-70b-instruct"
# model_id = "mistralai/mistral-7b-instruct-v0-2"
# model_id = "mistralai/mixtral-8x7b-instruct-v01"
labeler = MachineLabeler(model_id=model_id,
                         instruction=instruction,
                         rubrics=rubrics,
                         output_format=output_format,
                         data_examples=data_examples,
                         num_example_samples=2,
                         num_prompt_samples=3)

# generate and save labels
labeler.label(data_unlabeled, save_dir=os.path.join(datapath, model_id, "labels"))

# evaluate on test data
evaluation = labeler.evaluate(data_test, save_dir=os.path.join(datapath, model_id, "labels"))

print(evaluation)
# plot_evaluation(evaluation)

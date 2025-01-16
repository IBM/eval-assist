# Installation

To install the labeler, run: `pip install -e .`

Ensure to add your own API key file (for BAM) as `api_keys/ibm_bam_api_config.env`.

# Formatting Guidelines

## Format of `rubrics`:

The `rubrics` dictionary must be of the following form:

    rubrics = {
        <unique name of the requirement> : {
            "requirement": <description of the requirement>,
            "criteria": {
                <name of first criteria>: <description of what it means to satisfy the first criteria>,
                <name of second criteria>: <description of what it means to satisfy the second criteria>,
                ... 
            },
            "labeling_notes": [<note 1>, <note 2>, <mote 3>, ...]  # optional
        },
        ... 
    }

Each element (rubric) must be assigned a unique name. The corresponding dictionary contains the following elements: 
- `requirement` (required): a natural language description of the rubric requirement
- `criteria` (required): a dictionary of the criteria under which the data is labeled
- `labeling_notes` (optional): a list of strings intended to provide clarification on the labeling task (e.g., additional definitions)

For example, the `rubrics` for evaluating the answer to a question with respect to both 
`relevance` and `toxicity` would be defined as follows:
    
    rubrics = {
        "relevance" : {
            "requirement": "The relevance of the answer with respect to the question."
            "criteria": {
                "yes": "The answer is relevant to the question.",
                "no": "The answer is not relevant to the question.",
            }
        },
        "toxicity" : {
            "requirement": "The toxicity of the answer with respect to the question."
            "criteria": {
                "yes": "The answer exhibits toxicity given the question.",
                "no": "The answer does not exibit toxicity given the question.",
            },
            "labeling_notes": [
                "A toxic response is any response that is harmful, offensive, or inappropriate."
            ]
        },
    }

### Notes
Given the natural language description of the rubrics, there is flexibility in how the requirements and criteria can be 
stated. There is no single correct way to define a rubric, however, it is important to specify the criteria for a given 
requirement to be an exhaustive and disjoint set of alternatives in order to provide the language model with a fair set 
of labels to choose from (this may require specifying a "not applicable" criterion in some cases). 

The `labeling_notes` field should be used sparingly and only specified if the requirement/criteria require knowledge of 
non-standard definitions.


## Format of `output_format`:

The `output_format` indicates the required format of the model's labels. Each element in `output_format` is a dictionary 
with required keys `name` and `description`. For example, the following `output_format` instructs the model to generate 
a label and an associated explanation for the label.

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



## Format of input data:

The labeler can be called in a variety of modes. In its simplest mode only unlabeled data is provided. Examples data
(for in-context examples) and test data (to evaluate accuracy of model's labels) can also be optionally defined. There 
is also the option to specify labeled data and use the `example_test_split` function to extract examples-test splits. 
The formatting is as follows:

### Unlabeled data 
Specified in `data_unlabeled.csv`; contains columns:
 - `id` *(required)*: a unique identifier for each datapoint
 - `input_*` *(required)*: column(s) that describe the datapoint to be labeled, e.g., `input_text` if the input to label is a single string
 - `type_*` *(optional)*: column(s) that describe additional category descriptors for each datapoint

### Labeled data
Specified in `data_labeled.csv`; contains columns:
 - `id` *(required)*: a unique identifier for each datapoint
 - `input_*` *(required)*: column(s) that describe the datapoint to be labeled
 - `label_*` *(required)*: column(s) that describe the label(s) of the datapoint
 - `type_*` *(optional)*: column(s) that describe additional category descriptors for each datapoint

### Example data
Specified in `data_examples.csv`; contains columns:
 - `id` *(required)*: a unique identifier for each datapoint
 - `input_*` *(required)*: column(s) that describe the datapoint to be labeled
 - `label_*` *(required)*: column(s) that describe the label(s) of the datapoint
 - `type_*` *(optional)*: column(s) that describe additional category descriptors for each datapoint

### Test data
Specified in `data_test.csv`; contains columns:
 - `id` *(required)*: a unique identifier for each datapoint
 - `input_*` *(required)*: column(s) that describe the datapoint to be labeled
 - `label_*` *(required)*: column(s) that describe the label(s) of the datapoint
 - `type_*` *(optional)*: column(s) that describe additional category descriptors for each datapoint. Accuracy is evaluated on every category of types.

### Additional formatting notes:
 - Label column names, `label_*`, must match rubric (key) names in `rubrics`, with values matching (key) names in corresponding `criteria` dictionary.



## Format of `instruction`:

The `instruction` serves to describe the labeling task to the model. It is used as a statement in the prompt preprended 
to the input under evaluation. 


This can be a simple string (e.g., `Please use the 
criteria to label the following text.`) or can make reference the input types (as named in the `type_*` columns of the 
data) to assist the model. For example, when labeling a response subject to conversational context it is helpful to 
explicitly include the speaker's name (this is because some models tend to infer reference to a response as the 
assistant's response even if the user is the one providing the response).

    instruction = "Please use the criteria to label the following {speaker}'s response subject to to the context."


# Examples

Please see the `/examples` directory.
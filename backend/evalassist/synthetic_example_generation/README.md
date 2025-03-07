# Synthetic Example Generation


## Run instructions

To install dependencies, create and activate a virtual environment (tested with Python 3.10) and run:
```commandline
pip install -r requirements.txt
```

### Example generation

Specify the model you would like to use in `config/config.yaml`. Example generation is run via `run_generation.py`. 

First, initialize your generator via:
```
generator = Generator(config, 'summarization')
```
for generating summarization examples, or
```
generator = Generator(config, 'text')
```
for generating text (sentence) examples. 

To generate examples, call the generate method via `generator.generate()`. Generations will be saved as a `.jsonl` file 
in the `/data` directory. 


### Validation

Validation is carried out by labeling the generations and comparing the labels with the generation's target. 

The validation step currently uses a synthetic labeler (called the machine labeler). To run validation, clone the 
(internal) repo via `git clone github.ibm.com/Principled-AI/machine-labeler.git` and install via
```commandline
cd machine-labeler
pip install -e .
```


### Controlling Refusal 

If your experiment requires controlling refusal (as specified by `use-liberated-model` in the config), you will need to first 
extract a refusal vector for the model. 

To do this, first clone the `activation-steering` repo via `git clone https://github.com/IBM/activation-steering.git`.

Next, install the package from the cloned directory via
```commandline
cd activation-steering
pip install -e .
```

Specify the desired `model-id` in `config.yaml` and run `refusal/run_refusal_extraction.py`. Refusal vectors will be saved to 
the `refusal/data/refusal_vectors` directory.

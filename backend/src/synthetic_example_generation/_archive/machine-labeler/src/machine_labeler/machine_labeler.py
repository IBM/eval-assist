from machine_labeler.model_access.model import Model
from machine_labeler.components.formatter import PromptFormatter
from machine_labeler.components.selector import Selector
from machine_labeler.utils.data_utils import get_evaluation
from machine_labeler.utils.labeling_utils import load_templates
from machine_labeler.utils.config import CONFIG, get_param


class MachineLabeler:
    """
    Instantiates a machine labeler using the model specified by model_id.

    Args:
        model_id (str): Identifier for the model to use
        instruction (str): Instruction for the labeling task
        rubrics (dict): Rubrics to apply
        output_format (list): Format of the output
        data_examples (list, optional): Example data for few-shot learning; defaults to None.
        num_samples (int, optional): Number of times to label each input; defaults to config.
        selector_method (str, optional): Name of selector method; defaults to config.
        num_examples (int, optional): Number of few-shot examples to include per criteria; defaults to config.
        shuffle_criteria (bool, optional): Whether to randomize the order of criteria in the prompt; defaults to config.
    """
    def __init__(self,
                 model_id,
                 instruction,
                 rubrics,
                 output_format,
                 data_examples=None,
                 **kwargs):
        super().__init__()
        self.model_id = model_id
        self.instruction = instruction
        self.rubrics = rubrics
        self.output_format = output_format
        self.data_examples = data_examples

        self.templates = load_templates()
        self.template_category = CONFIG['model-config'][model_id]['template-category']

        # initialize model
        self.model = Model(model_id, CONFIG)

        # param overrides of default config from any provided kwargs
        config = CONFIG['defaults']
        self.num_samples = get_param('num-samples', kwargs, config['labeler'])
        self.selector_method = get_param('name', kwargs, config['selector'])
        self.num_examples_per_crit = get_param('num-examples-per-crit', kwargs, config['selector'])
        self.shuffle_criteria = get_param('shuffle-criteria', kwargs, config['formatter'])

        # in-context example selector
        self.selector = Selector(method=self.selector_method,
                                 model=self.model)

        # prompt formatter
        self.prompt_formatter = PromptFormatter(instruction=self.instruction,
                                                rubrics=self.rubrics,
                                                templates=self.templates,
                                                template_category=self.template_category,
                                                num_samples=self.num_samples,
                                                examples=self.data_examples,
                                                num_examples_per_crit=self.num_examples_per_crit,
                                                shuffle_criteria=self.shuffle_criteria,
                                                example_selector=self.selector,
                                                output_format=self.output_format)

    def label(self, data_unlabeled, save_dir):

        # generate labels
        prompts = self.prompt_formatter.get_prompts(
            input_data=data_unlabeled
        )
        results = self.model.generate(prompts=prompts,
                                      output_format=self.output_format)

        # save labels
        if save_dir:
            self._save_results(results, save_dir)

        return results

    def evaluate(self, data_test, save_dir):
        # todo: evaluate test accuracy for each category defined by `type` columns of test data (if they exist)
        #  - ideally compare distributions

        # label test data
        labels_test = self.model.call(data_unlabeled=data_test,
                                      instruction=self.instruction,
                                      rubrics=self.rubrics,
                                      templates=self.templates,
                                      data_examples=self.data_examples,
                                      num_example_samples=self.num_example_samples,
                                      num_prompt_samples=self.num_prompt_samples,
                                      save_dir=save_dir)

        # evaluate accuracy
        evaluation = get_evaluation(rubrics=self.rubrics,
                                    data_test=data_test,
                                    labels_test=labels_test)

        return evaluation

    def _save_results(self, results, save_dir):
        pass

    # def _check_input_format(self):
    #     if self.data_labeled:
    #         # todo: compare rubrics with columns of labeled data to ensure that label names match, raise error if not
    #         pass
    #     # todo: assert format of unlabeled data

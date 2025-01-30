

class Selector:
    """A class for selecting in-context examples.

    This class implements various methods for choosing in-context examples. Methods include:
        - "random": samples num_examples for each criterion uniformly at random from the pool
        - "max_info":
        - "":

    Args:
        method (str): Selection strategy.
        model (optional): Model instance (for methods that require model-based selection).
    """
    def __init__(self, method, model=None):
        self.method = method
        self.model = model

        if self.method == "random":
            pass
        elif self.method == "cluster":
            pass
        else:
            raise ValueError(f"Unknown example selection method: {self.method}")

    def select_examples(self, example_pool, rubric_name, rubric_dict, num_examples_per_crit, num_samples):

        # todo: use langchain example selector
        # todo: implement other methods

        selected_examples = []
        for _ in range(num_samples):
            sample_dict = {}

            if self.method == "random":

                label_column = f"label_{rubric_name}"
                rubric_samples = {}
                for criterion in rubric_dict['criteria'].keys():
                    criterion_examples = example_pool[example_pool[label_column] == criterion]
                    if len(criterion_examples) >= num_examples_per_crit:
                        sampled = criterion_examples.sample(n=num_examples_per_crit)
                    else:
                        sampled = criterion_examples.sample(n=num_examples_per_crit, replace=True)
                    rubric_samples[criterion] = sampled['id'].tolist()
                sample_dict[rubric_name] = rubric_samples

            selected_examples.append(sample_dict)

        return selected_examples

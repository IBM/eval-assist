import os
import yaml


def get_param(param_name, params, config):
    return params.get(param_name, config[param_name])


def load_defaults():
    package_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_path = os.path.join(package_dir, 'config.yaml')

    with open(config_path, 'r') as f:
        return yaml.safe_load(f)


CONFIG = load_defaults()

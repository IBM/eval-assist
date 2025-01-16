from generate import Generator
from utils.data_utils import load_yaml

config = load_yaml("config/config.yaml")

# generator = Generator(config, generation_type='text-harm')
# generator = Generator(config, generation_type='qa-relevance')
generator = Generator(config, generation_type='summarization-coherence')

generator.generate()

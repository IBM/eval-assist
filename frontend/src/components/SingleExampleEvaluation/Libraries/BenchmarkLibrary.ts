import { Benchmark, PipelineType } from '../../../utils/types'

export const benchmarkLibrary: Benchmark[] = [
  {
    name: 'MIT-IBM',
    description:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
    type: PipelineType.RUBRIC,
    dataset: {
      name: 'MIT-IBM',
      description: 'loren ipsum',
    },
    criteriaBenchmarks: [
      {
        name: 'Answer relevance',
        evaluatorBenchmarks: [
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: '0.8.0',
            results: {
              agreement: '3%',
              p_bias: 0.66,
              pearson: 0.57,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: '0.9.0',
            results: {
              agreement: '60%',
              p_bias: 0.5,
              pearson: 0.7,
            },
          },
          {
            evaluator_id: 'llama-3-70b-instruct_based_evaluator',
            laaj_version: '0.8.0',
            results: {
              agreement: '60%',
              p_bias: 0.5,
              pearson: 0.7,
            },
          },
        ],
      },
      {
        name: 'Conciseness',
        evaluatorBenchmarks: [
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: '0.8.0',
            results: {
              agreement: '60%',
              p_bias: 0.66,
              pearson: 0.57,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: '0.9.0',
            results: {
              agreement: '60%',
              p_bias: 0.5,
              pearson: 0.7,
            },
          },
          {
            evaluator_id: 'llama-3-70b-instruct_based_evaluator',
            laaj_version: '0.8.0',
            results: {
              agreement: '59%',
              p_bias: 0.5,
              pearson: 0.7,
            },
          },
        ],
      },
    ],
  },
  {
    name: 'MIT-IBM 2',
    description:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
    type: PipelineType.PAIRWISE,
    dataset: {
      name: 'MIT-IBM',
      description: 'loren ipsum',
    },
    criteriaBenchmarks: [
      {
        name: 'Factually Consistent',
        evaluatorBenchmarks: [
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: '0.8.0',
            results: {
              agreement: '60%',
              p_bias: 0.66,
              pearson: 0.57,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: '0.9.0',
            results: {
              agreement: '60%',
              p_bias: 0.5,
              pearson: 0.7,
            },
          },
          {
            evaluator_id: 'llama-3-70b-instruct_based_evaluator',
            laaj_version: '0.8.0',
            results: {
              agreement: '60%',
              p_bias: 0.66,
              pearson: 0.57,
            },
          },
        ],
      },
    ],
  },
]

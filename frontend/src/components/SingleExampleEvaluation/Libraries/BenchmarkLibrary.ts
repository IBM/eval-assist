import { Benchmark, PipelineType } from '../../../utils/types'

const benchmarkLibrary: Benchmark[] = [
  {
    name: 'MIT-IBM Benchmark',
    description: 'loren ipsum',
    type: PipelineType.RUBRIC,
    dataset: {
      name: 'MIT-IBM',
      description: 'loren ipsum',
    },
    criteriaBenchmarks: [
      {
        name: 'naturalness',
        evaluatorBenchmarks: [
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laas_version: '0.8.0',
            results: {
              agreement: '60%',
              p_bias: 0.66,
              pearson: 0.57,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laas_version: '0.9.0',
            results: {
              agreement: '60%',
              p_bias: 0.5,
              pearson: 0.7,
            },
          },
          {
            evaluator_id: 'llama-3-70b-instruct_based_evaluator',
            laas_version: '0.8.0',
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

import { Benchmark, PipelineType } from '../utils/types'

export const benchmarkLibrary: Benchmark[] = [
  {
    name: 'FeedbackQA - 500 question sample',
    description: 'loren ipsum',
    type: PipelineType.RUBRIC,
    dataset: {
      name: 'FeedbackQA',
      description: 'loren ipsum',
    },
    criteriaBenchmarks: [
      {
        name: 'Quality',
        evaluatorBenchmarks: [
          {
            evaluator_id: 'mistralai/mixtral-8x7b-instruct-v01',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '45.6%',
              p_bias: 0.088,
              pearson: 0.767,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '64.0%',
              p_bias: 0.094,
              pearson: 0.725,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-8b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '38.5%',
              p_bias: 0.028,
              pearson: 0.579,
            },
          },
          {
            evaluator_id: 'kaist-ai/prometheus-8x7b-v2',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '38.5%',
              p_bias: 0.328,
              pearson: 0.579,
            },
          },
        ],
      },
    ],
  },
  {
    name: 'TruthfulQA - 100 question sample',
    description: 'loren ipsum',
    type: PipelineType.RUBRIC,
    dataset: {
      name: 'TruthfulQA',
      description: 'loren ipsum',
    },
    criteriaBenchmarks: [
      {
        name: 'Truthfulness',
        evaluatorBenchmarks: [
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '77.6%',
              p_bias: 0.02,
              pearson: 0.567,
            },
          },
          {
            evaluator_id: 'mistralai/mixtral-8x7b-instruct-v01',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '70.0%',
              p_bias: 0.0,
              pearson: 0.476,
            },
          },
          {
            evaluator_id: 'kaist-ai/prometheus-8x7b-v2',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '62.6%',
              p_bias: 0.09,
              pearson: 0.335,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-8b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '57%',
              p_bias: 0.14,
              pearson: 0.244,
            },
          },
        ],
      },
    ],
  },
  {
    name: 'TruthfulQA - 100 question sample',
    description: 'loren ipsum',
    type: PipelineType.PAIRWISE,
    dataset: {
      name: 'TruthfulQA',
      description: 'loren ipsum',
    },
    criteriaBenchmarks: [
      {
        name: 'Truthfulness',
        evaluatorBenchmarks: [
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '91.8%',
              p_bias: 0.03,
              pearson: 0.847,
            },
          },
          {
            evaluator_id: 'mistralai/mixtral-8x7b-instruct-v01',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '87.8%',
              p_bias: 0.02,
              pearson: 0.755,
            },
          },
          {
            evaluator_id: 'kaist-ai/prometheus-8x7b-v2',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '84.4%',
              p_bias: 0.23,
              pearson: 0.687,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-8b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '80.4%',
              p_bias: 0.03,
              pearson: 0.61,
            },
          },
        ],
      },
    ],
  },
  {
    name: 'Summarization CNN/DM - 100 question sample',
    description: 'loren ipsum',
    type: PipelineType.RUBRIC,
    dataset: {
      name: 'Summarization',
      description: 'loren ipsum',
    },
    criteriaBenchmarks: [
      {
        name: 'Coherence',
        evaluatorBenchmarks: [
          {
            evaluator_id: 'mistralai/mixtral-8x7b-instruct-v01',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '',
              p_bias: 0.0,
              pearson: 0.549,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '',
              p_bias: 0.224,
              pearson: 0.523,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-8b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '',
              p_bias: 0.0,
              pearson: 0.512,
            },
          },
          {
            evaluator_id: 'kaist-ai/prometheus-8x7b-v2',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '',
              p_bias: 0.418,
              pearson: 0.346,
            },
          },
        ],
      },
      {
        name: 'Consistency',
        evaluatorBenchmarks: [
          {
            evaluator_id: 'mistralai/mixtral-8x7b-instruct-v01',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '',
              p_bias: 0.01,
              pearson: 0.549,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-8b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '',
              p_bias: 0.0,
              pearson: 0.49,
            },
          },
          {
            evaluator_id: 'kaist-ai/prometheus-8x7b-v2',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '',
              p_bias: 0.475,
              pearson: 0.46,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '',
              p_bias: 0.202,
              pearson: 0.458,
            },
          },
        ],
      },
      {
        name: 'Fluency',
        evaluatorBenchmarks: [
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '',
              p_bias: 0.165,
              pearson: 0.404,
            },
          },
          {
            evaluator_id: 'mistralai/mixtral-8x7b-instruct-v01',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '',
              p_bias: 0.0,
              pearson: 0.274,
            },
          },
          {
            evaluator_id: 'kaist-ai/prometheus-8x7b-v2',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '',
              p_bias: 0.515,
              pearson: 0.185,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-8b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '',
              p_bias: 0.0,
              pearson: 0.124,
            },
          },
        ],
      },
      {
        name: 'Relevance',
        evaluatorBenchmarks: [
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '',
              p_bias: 0.4,
              pearson: 0.624,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-8b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '',
              p_bias: 0.558,
              pearson: 0.49,
            },
          },
          {
            evaluator_id: 'mistralai/mixtral-8x7b-instruct-v01',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '',
              p_bias: 0.021,
              pearson: 0.448,
            },
          },
          {
            evaluator_id: 'kaist-ai/prometheus-8x7b-v2',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '',
              p_bias: 0.463,
              pearson: 0.324,
            },
          },
        ],
      },
    ],
  },
  {
    name: 'MIT-IBM Benchmark',
    description:
      'This benchmark is about pairwise comparisons, where an LLM and a human select the best LLM response using the criteria below. The criteria contains multiple criteria and looks like this: Most importantly, the response should be accurate. Fact-check the response using the reference document. The reference document contains the accurate information needed to answer the customer question provided. In addition to being accurate, the response should be natural. The general tone should be natural and appropriate. Overall, the response should be more likely to satisfy the customer who asked the question.',
    type: PipelineType.PAIRWISE,
    dataset: {
      name: 'MIT-IBM',
      description:
        'This dataset accompanies the paper "What Leads to Successful Human-AI Collaboration? Prompt Guidance for Human Agents Using Conversational AI for Customer Support". It explores the dynamics of human-AI interaction within customer support scenarios, focusing on improving collaborative efficiency through various configurations.',
    },
    criteriaBenchmarks: [
      {
        name: 'Overall',
        evaluatorBenchmarks: [
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '72.7%',
              p_bias: 0.008,
              pearson: 0.434,
            },
          },
          {
            evaluator_id: 'kaist-ai/prometheus-8x7b-v2',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '70.8%',
              p_bias: 0.225,
              pearson: 0.396,
            },
          },
          {
            evaluator_id: 'mistralai/mixtral-8x7b-instruct-v01',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '70.8%',
              p_bias: 0.003,
              pearson: 0.395,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-8b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '68.1%',
              p_bias: 0.003,
              pearson: 0.334,
            },
          },
        ],
      },
    ],
  },
  {
    name: 'Feedback Collection Benchmark',
    description: 'loren ipsum',
    type: PipelineType.RUBRIC,
    dataset: {
      name: 'Feedback Collection',
      description: 'loren ipsum',
    },
    criteriaBenchmarks: [
      {
        name: 'Overall',
        evaluatorBenchmarks: [
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '47.6%',
              p_bias: 0.157,
              pearson: 0.77,
            },
          },
          {
            evaluator_id: 'kaist-ai/prometheus-8x7b-v2',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '42.2%',
              p_bias: 0.44,
              pearson: 0.764,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-8b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '36.1%',
              p_bias: 0.014,
              pearson: 0.692,
            },
          },
          {
            evaluator_id: 'mistralai/mixtral-8x7b-instruct-v01',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '32.9%',
              p_bias: 0.109,
              pearson: 0.558,
            },
          },
        ],
      },
    ],
  },
  {
    name: 'Reliance Study Benchmark',
    description: 'loren ipsum',
    type: PipelineType.RUBRIC,
    dataset: {
      name: 'Reliance Study',
      description:
        'This repository contains datasets and analysis from a study aimed at measuring reliance on Large Language Models (LLMs) output across various tasks. Our study employed a controlled experiment design to investigate how different cognitive forcing functions (CFFs) affect users editing behavior concerning accuracy and naturalness of LLM outputs, including the impact of hallucinations in responses.',
    },
    criteriaBenchmarks: [
      {
        name: 'Irrelevant information',
        evaluatorBenchmarks: [
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '73.5%',
              p_bias: 0.032,
              pearson: 0.325,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-8b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '62.9%',
              p_bias: 0.031,
              pearson: 0.002,
            },
          },
          {
            evaluator_id: 'mistralai/mixtral-8x7b-instruct-v01',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '56.1%',
              p_bias: 0.0,
              pearson: 0.183,
            },
          },
          {
            evaluator_id: 'kaist-ai/prometheus-8x7b-v2',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '37.5%',
              p_bias: 0.188,
              pearson: -0.041,
            },
          },
        ],
      },
      {
        name: 'Addressing',
        evaluatorBenchmarks: [
          {
            evaluator_id: 'mistralai/mixtral-8x7b-instruct-v01',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '79.8%',
              p_bias: 0.0,
              pearson: 0.183,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '72.2%',
              p_bias: 0.055,
              pearson: 0.325,
            },
          },
          {
            evaluator_id: 'kaist-ai/prometheus-8x7b-v2',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '51.3%',
              p_bias: 0.188,
              pearson: -0.041,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-8b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '48.5%',
              p_bias: 0.013,
              pearson: 0.002,
            },
          },
        ],
      },
      {
        name: 'Conversational',
        evaluatorBenchmarks: [
          {
            evaluator_id: 'mistralai/mixtral-8x7b-instruct-v01',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '44.4%',
              p_bias: 0.0,
              pearson: 0.183,
            },
          },
          {
            evaluator_id: 'kaist-ai/prometheus-8x7b-v2',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '14.8%',
              p_bias: 0.064,
              pearson: -0.041,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '14.0%',
              p_bias: 0.028,
              pearson: 0.325,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-8b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '13.6%',
              p_bias: 0.02,
              pearson: 0.002,
            },
          },
        ],
      },
      {
        name: 'Naturalness',
        evaluatorBenchmarks: [
          {
            evaluator_id: 'mistralai/mixtral-8x7b-instruct-v01',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '77.1%',
              p_bias: 0.0,
              pearson: 0.183,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '25.7%',
              p_bias: 0.095,
              pearson: 0.325,
            },
          },
          {
            evaluator_id: 'kaist-ai/prometheus-8x7b-v2',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '21.3%',
              p_bias: 0.127,
              pearson: -0.041,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-8b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '13.3%',
              p_bias: 0.029,
              pearson: 0.002,
            },
          },
        ],
      },
      {
        name: 'Information from the reference document',
        evaluatorBenchmarks: [
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '90.7%',
              p_bias: 0.02,
              pearson: 0.325,
            },
          },
          {
            evaluator_id: 'mistralai/mixtral-8x7b-instruct-v01',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '86.8%',
              p_bias: 0.004,
              pearson: 0.183,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-8b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '82.7%',
              p_bias: 0.18,
              pearson: 0.002,
            },
          },
          {
            evaluator_id: 'kaist-ai/prometheus-8x7b-v2',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '53.9%',
              p_bias: 0.145,
              pearson: -0.041,
            },
          },
        ],
      },
      {
        name: 'Information outside of the reference document',
        evaluatorBenchmarks: [
          {
            evaluator_id: 'meta-llama/llama-3-70b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '89.2%',
              p_bias: 0.017,
              pearson: 0.325,
            },
          },
          {
            evaluator_id: 'kaist-ai/prometheus-8x7b-v2',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '79.4%',
              p_bias: 0.181,
              pearson: -0.041,
            },
          },
          {
            evaluator_id: 'meta-llama/llama-3-8b-instruct',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '60.1%',
              p_bias: 0.126,
              pearson: 0.002,
            },
          },
          {
            evaluator_id: 'mistralai/mixtral-8x7b-instruct-v01',
            laaj_version: 'v0.0.7-alpha',
            results: {
              agreement: '36.8%',
              p_bias: 0.004,
              pearson: 0.183,
            },
          },
        ],
      },
    ],
  },
]

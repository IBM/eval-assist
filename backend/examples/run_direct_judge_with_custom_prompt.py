from evalassist.judges import DirectJudge
from evalassist.judges.const import DEFAULT_JUDGE_INFERENCE_PARAMS
from unitxt.inference import CrossProviderInferenceEngine

judge = DirectJudge(
    inference_engine=CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        **DEFAULT_JUDGE_INFERENCE_PARAMS,
    ),
)

judge_prompt = """You are an expert grader. Your job is to evaluate how factually grounded an AI-generated answer is, based on a given context. From provider combination of Question, Context and Answer, you must judge whether the answer contains any hallucinations — i.e., information not found or contradicted by the context.

## Grading Scale:
Rate the answer from 1 to 5 using this rubric:

- 5: Fully grounded — All parts of the answer are directly supported by the context.
- 4: Mostly grounded — Minor details may be unverifiable, but the answer is mostly faithful.
- 3: Partially grounded — Some parts are correct, some are not verifiable or possibly incorrect.
- 2: Minimally grounded — Most of the content is unsupported or speculative.
- 1: Not grounded — The answer contradicts or fabricates facts entirely.

Question: Who developed the theory of relativity?
Context:
Albert Einstein, a German-born physicist, developed the theory of relativity in the early 20th century. It revolutionized theoretical physics and introduced concepts such as time dilation and the equivalence of mass and energy.",
Answer: The theory of relativity was developed by Albert Einstein in the early 20th century.
"""

results = judge.evaluate_with_custom_prompt(
    judge_prompts=[judge_prompt],
    valid_outputs=(1, 5),  # or [1, 2, 3, 4, 5]
)

print("### Selected option / Score")
print(f"{results[0].selected_option} / {results[0].score}")
"""
5 / 5.0
"""

print("\n### Explanation")
print(results[0].explanation)
"""
The answer states that the theory of relativity was developed by Albert Einstein in the early 20th century, which is directly supported by the context. The context explicitly mentions that Albert Einstein, a German-born physicist, developed the theory of relativity in the early 20th century. Therefore, all parts of the answer are directly supported by the context.
"""

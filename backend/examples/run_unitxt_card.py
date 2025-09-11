import json
from typing import cast

import unitxt
from evalassist.judges import Criteria, DirectInstance, DirectJudge
from unitxt.api import evaluate, load_dataset
from unitxt.inference import CrossProviderInferenceEngine
from unitxt.templates import InputOutputTemplate

# import nest_asyncio
# nest_asyncio.apply()

unitxt.settings.allow_unverified_code = True
dataset = load_dataset(
    card="cards.rag_eval.faithfulness.ragbench.finqa",
    template=InputOutputTemplate(
        output_format="{number_val}",
        input_format="{question}",
        postprocessors=["processors.cast_to_float_return_0_5_if_failed"],
    ),
    format="formats.empty",
    loader_limit=40,
    split="test",
)

criterion = "metrics.llm_as_judge.direct.criteria.reference_document_faithfulness"

eval_assist_criteria: Criteria = Criteria.from_unitxt_criteria(criterion)
instances: list[DirectInstance] = []
for row in dataset:
    task_data = json.loads(row["task_data"])  # type: ignore
    instances.append(
        DirectInstance(
            context={
                "contexts": str(task_data["contexts"]),
                "question": task_data["question"],
            },
            response=task_data["answer"],
        )
    )

judge = DirectJudge(
    inference_engine=CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        use_cache=False,
        provider_specific_args={
            "watsonx": {
                "max_requests_per_second": 8,
            }
        },
    ),
)
results = judge(instances, eval_assist_criteria)
scores = [str(cast(float, r.score)) for r in results]

# for instance in dataset:
#    task_data=json.loads(instance['task_data'])
#    print(json.dumps(task_data,indent=4))
#    print(json.dumps(instance,indent=4))

results = evaluate(predictions=scores, data=dataset)


print("Instance Results:")
print(results.instance_scores.summary)

print("Global Results:")
print(results.global_scores.summary)

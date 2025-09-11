from evalassist.judges import DirectInstance, DirectJudge
from evalassist.judges.const import DEFAULT_JUDGE_INFERENCE_PARAMS
from evalassist.judges.types import Criteria, CriteriaOption
from unitxt.inference import CrossProviderInferenceEngine

judge = DirectJudge(
    inference_engine=CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        **DEFAULT_JUDGE_INFERENCE_PARAMS,
    ),
)

# --- Criteria definition ---
criteria_a = Criteria(
    name="Clarity",
    description="Is the customer support answer clear and easy to understand?",
    options=[
        CriteriaOption(name="Yes", description="", score=1.0),
        CriteriaOption(name="No", description="", score=0.0),
    ],
    # context_fields=[],
)

criteria_b = Criteria(
    name="Accuracy",
    description="Does the answer provide factually correct information based on the knowledge base?",
    options=[
        CriteriaOption(name="Yes", description="", score=1.0),
        CriteriaOption(name="No", description="", score=0.0),
    ],
    prediction_field="answer",
    context_fields=["reference_doc"],  # judge should check against knowledge base
)

criteria_c = Criteria(
    name="Relevance",
    description="Does the answer directly address the customer’s question?",
    options=[
        CriteriaOption(name="Yes", description="", score=1.0),
        CriteriaOption(name="No", description="", score=0.0),
    ],
    prediction_field="answer",
    context_fields=["customer_question"],
)

# --- Example instances ---
instances = [
    # Failing case: polite but inaccurate
    DirectInstance(
        context={
            "customer_question": "Can I reset my password without access to my email?",
            "reference_doc": (
                "Users can reset their password using the registered phone number "
                "or by contacting support if they don’t have email access."
            ),
        },
        response=(
            "Unfortunately, you cannot reset your password without email access. "
            "You’ll need to create a new account."
        ),
    ),
    # Passing case: clear, accurate, relevant
    DirectInstance(
        context={
            "customer_question": "Can I reset my password without access to my email?",
            "reference_doc": (
                "Users can reset their password using the registered phone number "
                "or by contacting support if they don’t have email access."
            ),
        },
        response=(
            "Yes, you can reset your password without your email. "
            "Use your registered phone number or contact support for assistance."
        ),
    ),
    # Mixed case: clear but not fully accurate (ignores phone option)
    DirectInstance(
        context={
            "customer_question": "Can I reset my password without access to my email?",
            "reference_doc": (
                "Users can reset their password using the registered phone number "
                "or by contacting support if they don’t have email access."
            ),
        },
        response=(
            "Yes, just contact our support team and they will help you reset your password."
        ),
    ),
]

# --- Match criteria per instance ---
criteria_list = [criteria_a, criteria_b, criteria_c]

# --- Run judge ---
results = judge(instances, criteria_list)


for i, r in enumerate(results):
    print(f"## Result {i + 1}")
    print("### Selected option / Score")
    print(f"{results[i].option} / {results[i].score}")
    # print("\n### Explanation")
    # print(results[i].explanation)
"""
## Result 1
### Selected option / Score
No / 0.0
## Result 2
### Selected option / Score
Yes / 1.0
## Result 3
### Selected option / Score
Yes / 1.0
"""

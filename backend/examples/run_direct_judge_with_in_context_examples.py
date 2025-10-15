from evalassist.judges import DirectInstance, DirectJudge
from evalassist.judges.const import DEFAULT_JUDGE_INFERENCE_PARAMS
from evalassist.judges.types import Criteria, CriteriaOption, InstanceWithGroundTruth
from unitxt.inference import CrossProviderInferenceEngine

judge = DirectJudge(
    inference_engine=CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        **DEFAULT_JUDGE_INFERENCE_PARAMS,
    ),
)
# --- Criteria definition ---
criteria = Criteria(
    name="Clarity",
    description=(
        "Evaluates whether the customer support answer is clear, easy to understand, "
        "and provides the user with actionable guidance. Answers should be complete, "
        "well-structured, and avoid ambiguity."
    ),
    options=[
        CriteriaOption(
            name="Yes",
            description="The answer is clear, concise, and helpful.",
            score=1.0,
        ),
        CriteriaOption(
            name="No",
            description="The answer is confusing, incomplete, or misleading.",
            score=0.0,
        ),
    ],
    prediction_field="answer",
    context_fields=["customer_question"],
    examples=[
        # Clear & helpful
        InstanceWithGroundTruth(
            instance=DirectInstance(
                context={"customer_question": "How do I reset my password?"},
                response=(
                    "You can reset your password by clicking 'Forgot Password' on the login page. "
                    "Follow the instructions sent to your registered email to complete the reset."
                ),
            ),
            ground_truth="Yes",
        ),
        # Confusing or incomplete
        InstanceWithGroundTruth(
            instance=DirectInstance(
                context={"customer_question": "How do I track my order?"},
                response="Track order maybe via account settings or email link. Hope this helps.",
            ),
            ground_truth="No",
        ),
        # Clear, structured
        InstanceWithGroundTruth(
            instance=DirectInstance(
                context={"customer_question": "Do you offer international shipping?"},
                response=(
                    "Yes, we ship internationally. You can select your country at checkout, "
                    "and shipping costs will be calculated automatically."
                ),
            ),
            ground_truth="Yes",
        ),
        # Misleading or incomplete
        InstanceWithGroundTruth(
            instance=DirectInstance(
                context={"customer_question": "Can I return an item?"},
                response="Return item no, not sure. Check website maybe.",
            ),
            ground_truth="No",
        ),
    ],
)

# --- Test instances ---
instances = [
    # Failing case: polite but inaccurate
    DirectInstance(
        context={
            "customer_question": "Can I reset my password without access to my email?"
        },
        response=(
            "Unfortunately, you cannot reset your password without email access. "
            "You’ll need to create a new account."
        ),
    ),
    # Passing case: clear, accurate, relevant
    DirectInstance(
        context={
            "customer_question": "Can I reset my password without access to my email?"
        },
        response=(
            "Yes, you can reset your password without your email. "
            "Use your registered phone number or contact support for assistance."
        ),
    ),
    # Mixed case: clear but not fully accurate (ignores phone option)
    DirectInstance(
        context={
            "customer_question": "Can I reset my password without access to my email?"
        },
        response=(
            "Yes, just contact our support team and they will help you reset your password."
        ),
    ),
    # Failing case: overly vague
    DirectInstance(
        context={"customer_question": "Where can I find my invoice?"},
        response="Check the app or website.",
    ),
    # Passing case: clear & actionable
    DirectInstance(
        context={"customer_question": "Where can I find my invoice?"},
        response=(
            "You can find your invoice by logging into your account, clicking 'Orders', "
            "then selecting the order you want. The invoice will be available for download."
        ),
    ),
]

# --- Run judge ---
results = judge(instances, criteria)


for i, r in enumerate(results):
    print(f"## Result {i + 1}")
    print("### Selected option / Score")
    print(f"{results[i].selected_option} / {results[i].score}")
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

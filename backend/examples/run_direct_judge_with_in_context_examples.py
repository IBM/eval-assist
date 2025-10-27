from evalassist.judges import DirectJudge, Instance
from evalassist.judges.const import DEFAULT_JUDGE_INFERENCE_PARAMS
from evalassist.judges.types import Criteria, CriteriaOption, InstanceResult
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
    to_evaluate_field="answer",
    context_fields=["customer_question"],
    examples=[
        # Clear & helpful
        InstanceResult(
            instance=Instance(
                fields={
                    "customer_question": "How do I reset my password?",
                    "answer": "You can reset your password by clicking 'Forgot Password' on the login page. "
                    "Follow the instructions sent to your registered email to complete the reset.",
                },
            ),
            selected_option="Yes",
            explanation=(
                "The answer is clearly structured and directly addresses the user's question. "
                "It explains both where to go ('Forgot Password' on the login page) and what to do next.\n"
                "* Provides a specific action ('clicking Forgot Password').\n"
                "* Mentions follow-up steps involving the email instructions.\n"
                "* Uses complete sentences without ambiguity."
            ),
        ),
        # Confusing or incomplete
        InstanceResult(
            instance=Instance(
                fields={
                    "customer_question": "How do I track my order?",
                    "answer": "Track order maybe via account settings or email link. Hope this helps.",
                },
            ),
            selected_option="No",
            explanation=(
                "The answer is vague and lacks clear instructions. The user is left unsure of the "
                "exact steps to take.\n"
                "* Uses uncertain language ('maybe') rather than definitive steps.\n"
                "* Does not specify where in account settings or what email link is referenced.\n"
                "* Ends with a filler phrase ('Hope this helps') instead of actionable guidance."
            ),
        ),
        # Clear, structured
        InstanceResult(
            instance=Instance(
                fields={
                    "customer_question": "Do you offer international shipping?",
                    "answer": (
                        "Yes, we ship internationally. You can select your country at checkout, "
                        "and shipping costs will be calculated automatically."
                    ),
                },
            ),
            selected_option="Yes",
            explanation=(
                "The response is direct and informative, giving both the answer and relevant process details.\n"
                "* Confirms availability of international shipping clearly ('Yes, we ship internationally').\n"
                "* Provides procedural guidance ('select your country at checkout').\n"
                "* Describes what happens next ('shipping costs will be calculated automatically')."
            ),
        ),
        # Misleading or incomplete
        InstanceResult(
            instance=Instance(
                fields={
                    "customer_question": "Can I return an item?",
                    "answer": "Return item no, not sure. Check website maybe.",
                },
            ),
            selected_option="No",
            explanation=(
                "The response is unclear, hesitant, and unhelpful. It does not provide a definitive "
                "answer or actionable steps.\n"
                "* Uses uncertain and contradictory phrasing ('no, not sure').\n"
                "* Offers no concrete guidance ('Check website maybe').\n"
                "* Lacks structure, clarity, and accurate information."
            ),
        ),
    ],
)


# --- Test instances ---
instances = [
    Instance(
        fields={
            "customer_question": "Can I reset my password without access to my email?",
            "answer": (
                "Unfortunately, you cannot reset your password without email access. "
                "You’ll need to create a new account."
            ),
        },
    ),
    Instance(
        fields={
            "customer_question": "Can I reset my password without access to my email?",
            "answer": (
                "Yes, you can reset your password without your email. "
                "Use your registered phone number or contact support for assistance."
            ),
        },
    ),
    Instance(
        fields={
            "customer_question": "Can I reset my password without access to my email?",
            "answer": (
                "Yes, just contact our support team and they will help you reset your password."
            ),
        },
    ),
    # Failing case: overly vague
    Instance(
        fields={
            "customer_question": "Where can I find my invoice?",
            "answer": "Check the app or website.",
        },
    ),
    # Passing case: clear & actionable
    Instance(
        fields={
            "customer_question": "Where can I find my invoice?",
            "answer": (
                "You can find your invoice by logging into your account, clicking 'Orders', "
                "then selecting the order you want. The invoice will be available for download."
            ),
        },
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
Yes / 1.0
## Result 2
### Selected option / Score
Yes / 1.0
## Result 3
### Selected option / Score
Yes / 1.0
## Result 4
### Selected option / Score
No / 0.0
## Result 5
### Selected option / Score
Yes / 1.0
"""

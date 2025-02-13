import uuid

from datasets import load_dataset

min_words = 300

ds = load_dataset("vblagoje/cc_news")
df = ds["train"].to_pandas()

df = df[df["text"].apply(lambda x: len(str(x).split()) > min_words)]

df = df.sample(n=1000, random_state=666)

df = df[["text"]].copy()
df["id"] = [str(uuid.uuid4()) for _ in range(len(df))]
df = df[["id", "text"]]

json_path = "articles.jsonl"
df.to_json(json_path, orient="records", lines=True)

import uuid
from datasets import load_dataset

ds = load_dataset("microsoft/wiki_qa")
df = ds['train'].to_pandas()

df = df.drop_duplicates(subset=['question'])

df = df.sample(n=1000, random_state=666)

df['question'] = df['question'].apply(lambda x: x + '?' if not x.endswith('?') else x)
df = df[['question']].copy()
df['id'] = [str(uuid.uuid4()) for _ in range(len(df))]
df = df[['id', 'question']]

json_path = 'questions.json'
df.to_json(json_path, orient='records', lines=True)

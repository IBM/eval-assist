import json
import os
import yaml
import random
import pandas as pd


def load_yaml(filepath):
    with open(filepath, 'r') as file:
        data = yaml.safe_load(file)
    return data


def save_to_json(data, filename):
    with open(filename, "w") as f:
        json.dump(data, f)


def save_to_jsonl(data, filename):
    dir = filename.rsplit('/', 1)[0]
    os.makedirs(dir, exist_ok=True)
    with open(filename, 'w', encoding='utf-8') as f:
        for item in data:
            json_line = json.dumps(item)
            f.write(json_line + '\n')


def load_json_objects(filepath):
    decoder = json.JSONDecoder()
    data = []
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    idx = 0
    length = len(content)
    while idx < length:
        while idx < length and content[idx].isspace():
            idx += 1
        if idx >= length:
            break
        obj, offset = decoder.raw_decode(content, idx)
        data.append(obj)
        idx = offset
    return data


def load_jsonl(file_path, n=None):
    data = []
    with open(file_path, 'r') as file:
        for line in file:
            try:
                json_obj = json.loads(line)
                data.append(json_obj)
            except json.JSONDecodeError:
                print("skipping invalid json line")
    if n is not None:
        n = min(n, len(data))
        data = random.sample(data, n)
    return data

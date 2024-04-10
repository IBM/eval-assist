from genai import Credentials, Client
import os

BAM_API_KEY = os.getenv("GENAI_KEY", None)
BAM_API_URL = os.getenv("GENAI_API", None)
client = Client(credentials=Credentials(api_key=BAM_API_KEY, api_endpoint=BAM_API_URL))

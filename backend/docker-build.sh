ibmcloud target -g AIX-HCAI-RIS3
ibmcloud cr login
docker build --platform linux/amd64 . -t llm-judge-api
docker tag llm-judge-api us.icr.io/research3/llm-judge-api
docker push us.icr.io/research3/llm-judge-api

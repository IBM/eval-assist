
ibmcloud target -g AIX-HCAI-RIS3
ibmcloud cr login
docker build --platform linux/amd64 . -t llm-judge-ui
docker tag llm-judge-ui us.icr.io/research3/llm-judge-ui
docker push us.icr.io/research3/llm-judge-ui
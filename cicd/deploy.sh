# APP_COMPONENT="backend"  source backend/scripts/deploy.sh

#!/bin/bash
# This script checks the IBM Container Service cluster is ready, has a namespace configured with access to the private
# image registry (using an IBM Cloud API Key), perform a kubectl deploy of container image and check on outcome.
# uncomment to debug the script
# set -x
# copy the script below into your app code repo (e.g. ./scripts/check_and_deploy_kubectl.sh) and 'source' it from your pipeline job
#    source ./scripts/check_and_deploy_kubectl.sh
# alternatively, you can source it from online script:
#    source <(curl -sSL "https://raw.githubusercontent.com/open-toolchain/commons/master/scripts/check_and_deploy_kubectl.sh")
# ------------------
# source: https://raw.githubusercontent.com/open-toolchain/commons/master/scripts/check_and_deploy_kubectl.sh

# This script checks the IBM Container Service cluster is ready, has a namespace configured with access to the private
# image registry (using an IBM Cloud API Key), perform a kubectl deploy of container image and check on outcome.

# Input env variables (can be received via a pipeline environment properties.file.
echo "IMAGE_NAME_BACKEND=${IMAGE_NAME_BACKEND}"
echo "IMAGE_NAME_FRONTEND=${IMAGE_NAME_FRONTEND}"
echo "IMAGE_TAG=${IMAGE_TAG}"

echo "REGISTRY_URL=${REGISTRY_URL}"
echo "IMAGE_MANIFEST_SHA_BACKEND=${IMAGE_MANIFEST_SHA_BACKEND}"
echo "IMAGE_MANIFEST_SHA_FRONTEND=${IMAGE_MANIFEST_SHA_FRONTEND}"
echo "REGISTRY_NAMESPACE=${REGISTRY_NAMESPACE}"
echo "KUBERNETES_SERVICE_ACCOUNT_NAME=${KUBERNETES_SERVICE_ACCOUNT_NAME}"

if [ -z "${IMAGE_MANIFEST_SHA_BACKEND}" ]; then
  IMAGE_BACKEND="${REGISTRY_URL}/${REGISTRY_NAMESPACE}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG}"
else
  IMAGE_BACKEND="${REGISTRY_URL}/${REGISTRY_NAMESPACE}/${IMAGE_NAME_BACKEND}@${IMAGE_MANIFEST_SHA_BACKEND}"
fi
echo "IMAGE_BACKEND $IMAGE_BACKEND"

if [ -z "${IMAGE_MANIFEST_SHA_FRONTEND}" ]; then
  IMAGE_FRONTEND="${REGISTRY_URL}/${REGISTRY_NAMESPACE}/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG}"
else
  IMAGE_FRONTEND="${REGISTRY_URL}/${REGISTRY_NAMESPACE}/${IMAGE_NAME_FRONTEND}@${IMAGE_MANIFEST_SHA_FRONTEND}"
fi
echo "IMAGE_FRONTEND $IMAGE_FRONTEND"

# View build properties
if [ -f build.properties ]; then 
  echo "build.properties:"
  cat build.properties | grep -v -i password
else 
  echo "build.properties : not found"
fi 
# also run 'env' command to find all available env variables
# or learn more about the available environment variables at:
# https://cloud.ibm.com/docs/services/ContinuousDelivery/pipeline_deploy_var.html#deliverypipeline_environment

# Input env variables from pipeline job
echo "PIPELINE_KUBERNETES_CLUSTER_NAME=${PIPELINE_KUBERNETES_CLUSTER_NAME}"
echo "CLUSTER_NAMESPACE=${CLUSTER_NAMESPACE}"

# Use kubectl auth to check if the kubectl client configuration is appropriate
# check if the current configuration can create a deployment in the target namespace
echo "Check ability to create a kubernetes deployment in ${CLUSTER_NAMESPACE} using kubectl CLI"
kubectl auth can-i create deployment --namespace ${CLUSTER_NAMESPACE}

#Check cluster availability
echo "=========================================================="
echo "CHECKING CLUSTER readiness and namespace existence"
CLUSTER_INGRESS_SUBDOMAIN=""
CLUSTER_INGRESS_SECRET=""
echo "Configuring cluster namespace"
if kubectl get namespace ${CLUSTER_NAMESPACE}; then
  echo -e "Namespace ${CLUSTER_NAMESPACE} found."
else
  kubectl create namespace ${CLUSTER_NAMESPACE}
  echo -e "Namespace ${CLUSTER_NAMESPACE} created."
fi

# Grant access to private image registry from namespace $CLUSTER_NAMESPACE
# reference https://cloud.ibm.com/docs/containers?topic=containers-images#other_registry_accounts
echo "=========================================================="
echo -e "CONFIGURING ACCESS to private image registry from namespace ${CLUSTER_NAMESPACE}"
IMAGE_PULL_SECRET_NAME="ibmcloud-toolchain-${PIPELINE_TOOLCHAIN_ID}-${REGISTRY_URL}"

echo -e "Checking for presence of ${IMAGE_PULL_SECRET_NAME} imagePullSecret for this toolchain"
if ! kubectl get secret ${IMAGE_PULL_SECRET_NAME} --namespace ${CLUSTER_NAMESPACE}; then
  echo -e "${IMAGE_PULL_SECRET_NAME} not found in ${CLUSTER_NAMESPACE}, creating it"
  # for Container Registry, docker username is 'token' and email does not matter
  if [ -z "${PIPELINE_BLUEMIX_API_KEY}" ]; then PIPELINE_BLUEMIX_API_KEY=${IBM_CLOUD_API_KEY}; fi #when used outside build-in kube job
  kubectl --namespace ${CLUSTER_NAMESPACE} create secret docker-registry ${IMAGE_PULL_SECRET_NAME} --docker-server=${REGISTRY_URL} --docker-password=${PIPELINE_BLUEMIX_API_KEY} --docker-username=iamapikey --docker-email=a@b.com
else
  echo -e "Namespace ${CLUSTER_NAMESPACE} already has an imagePullSecret for this toolchain."
fi
if [ -z "${KUBERNETES_SERVICE_ACCOUNT_NAME}" ]; then KUBERNETES_SERVICE_ACCOUNT_NAME="default" ; fi
SERVICE_ACCOUNT=$(kubectl get serviceaccount ${KUBERNETES_SERVICE_ACCOUNT_NAME}  -o json --namespace ${CLUSTER_NAMESPACE} )
if ! echo ${SERVICE_ACCOUNT} | jq -e '. | has("imagePullSecrets")' > /dev/null ; then
  kubectl patch --namespace ${CLUSTER_NAMESPACE} serviceaccount/${KUBERNETES_SERVICE_ACCOUNT_NAME} -p '{"imagePullSecrets":[{"name":"'"${IMAGE_PULL_SECRET_NAME}"'"}]}'
else
  if echo ${SERVICE_ACCOUNT} | jq -e '.imagePullSecrets[] | select(.name=="'"${IMAGE_PULL_SECRET_NAME}"'")' > /dev/null ; then 
    echo -e "Pull secret already found in ${KUBERNETES_SERVICE_ACCOUNT_NAME} serviceAccount"
  else
    echo "Inserting toolchain pull secret into ${KUBERNETES_SERVICE_ACCOUNT_NAME} serviceAccount"
    kubectl patch --namespace ${CLUSTER_NAMESPACE} serviceaccount/${KUBERNETES_SERVICE_ACCOUNT_NAME} --type='json' -p='[{"op":"add","path":"/imagePullSecrets/-","value":{"name": "'"${IMAGE_PULL_SECRET_NAME}"'"}}]'
  fi
fi
echo "${KUBERNETES_SERVICE_ACCOUNT_NAME} serviceAccount:"
kubectl get serviceaccount ${KUBERNETES_SERVICE_ACCOUNT_NAME} --namespace ${CLUSTER_NAMESPACE} -o yaml
echo -e "Namespace ${CLUSTER_NAMESPACE} authorizing with private image registry using patched ${KUBERNETES_SERVICE_ACCOUNT_NAME} serviceAccount"
K8S_NAME=${CLUSTER_NAMESPACE}
BACKEND_K8S_NAME="${K8S_NAME}-backend"
FRONTEND_K8S_NAME="${K8S_NAME}-frontend"

echo "=========================================================="

deployment_content=$(cat <<EOT
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${FRONTEND_K8S_NAME}
  labels:
    app: ${FRONTEND_K8S_NAME}
spec:
  selector:
    matchLabels:
      app: ${FRONTEND_K8S_NAME}
  replicas: 1
  template:
    metadata:
      labels:
        app: ${FRONTEND_K8S_NAME}
    spec:
      containers:
        - name: ${FRONTEND_K8S_NAME}
          image: ${IMAGE_FRONTEND}
          resources:
            limits:
              cpu: 4
              memory: 2Gi
            requests:
              cpu: 2
              memory: 2Gi
          ports:
            - containerPort: 3000
          env:
            - name: APPID_CLIENT_ID
              valueFrom:
                secretKeyRef:
                  name: ${K8S_NAME}-secret
                  key: APPID_CLIENT_ID
            - name: APPID_CLIENT_SECRET
              valueFrom:
                secretKeyRef:
                  name: ${K8S_NAME}-secret
                  key: APPID_CLIENT_SECRET
            - name: APPID_ISSUER
              valueFrom:
                secretKeyRef:
                  name: ${K8S_NAME}-secret
                  key: APPID_ISSUER
            - name: NEXTAUTH_SECRET
              valueFrom:
                secretKeyRef:
                  name: ${K8S_NAME}-secret
                  key: NEXTAUTH_SECRET
            - name: NEXTAUTH_URL
              valueFrom:
                secretKeyRef:
                  name: ${K8S_NAME}-secret
                  key: NEXTAUTH_URL
      imagePullSecrets:
        - name: all-icr-io
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${BACKEND_K8S_NAME}
  labels:
    app: ${BACKEND_K8S_NAME}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${BACKEND_K8S_NAME}
  template:
    metadata:
      labels:
        app: ${BACKEND_K8S_NAME}
    spec:
      containers:
        - name: ${BACKEND_K8S_NAME}
          image: ${IMAGE_BACKEND}
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8000
          resources:
            limits:
              cpu: 4
              memory: 8Gi
            requests:
              cpu: 1
              memory: 4Gi
          volumeMounts:
            - name: eval-assist-volume
              mountPath: /app/prisma/db
      volumes:
        - name: eval-assist-volume
          persistentVolumeClaim:
            claimName: eval-assist-volume
---
apiVersion: v1
kind: Service
metadata:
  name: ${FRONTEND_K8S_NAME}
  labels:
    app: ${FRONTEND_K8S_NAME}
spec:
  type: NodePort
  selector:
    app: ${FRONTEND_K8S_NAME}
  ports:
    - name: http
      port: 80
      targetPort: 3000
      protocol: TCP
---
apiVersion: v1
kind: Service
metadata:
  name: ${BACKEND_K8S_NAME}
  labels:
    app: ${BACKEND_K8S_NAME}
spec:
  type: NodePort
  ports:
    - name: http
      port: 80
      targetPort: 8000
  selector:
    app: ${BACKEND_K8S_NAME}
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    ingress.kubernetes.io/allow-http: "false"
    ingress.kubernetes.io/ssl-redirect: "true"
    kubernetes.io/ingress.class: f5
    virtual-server.f5.com/balance: round-robin
    virtual-server.f5.com/ip: 9.12.246.105
    virtual-server.f5.com/partition: RIS3-INT-OCP-DAL12
    virtual-server.f5.com/clientssl: '[ { "bigIpProfile": "/Common/BlueMix" } ]'
  name: ${K8S_NAME}
  namespace: ${CLUSTER_NAMESPACE}
spec:
  rules:
    - host: ${CLUSTER_NAMESPACE}-api.bx.cloud9.ibm.com
      http:
        paths:
          - backend:
              service:
                name: ${BACKEND_K8S_NAME}
                port:
                  number: 80
            path: /
            pathType: ImplementationSpecific
    - host: ${CLUSTER_NAMESPACE}.bx.cloud9.ibm.com
      http:
        paths:
        - backend:
            service:
              name: ${FRONTEND_K8S_NAME}
              port:
                number: 80
          path: /
          pathType: ImplementationSpecific

EOT
)
# Find the port
PORT=$(ibmcloud cr image-inspect "${IMAGE_BACKEND}" --format '{{ range $key,$value := .Config.ExposedPorts }} {{ $key }} {{ "" }} {{end}}' | sed -E 's/^[^0-9]*([0-9]+).*$/\1/') || true
if [ "$PORT" -eq "$PORT" ] 2>/dev/null; then
  echo "ExposedPort $PORT found while inspecting image ${IMAGE_BACKEND}"
else 
  echo "Found '$PORT' as ExposedPort while inspecting image ${IMAGE_BACKEND}, non numeric value so using 5000 as containerPort"
  PORT=5000
fi
NEW_DEPLOYMENT_FILE="./tmp.deployment.yml"
DEPLOYMENT_FILE=${NEW_DEPLOYMENT_FILE} # use modified file
# Generate deployment file  
# Derive an application name from toolchain name ensuring it is conform to DNS-1123 subdomain
printf "$deployment_content" | tee ${DEPLOYMENT_FILE}

echo "GENERATED ${DEPLOYMENT_FILE}:"

echo "=========================================================="
echo "DEPLOYING using manifest"
set -x
kubectl apply --namespace ${CLUSTER_NAMESPACE} -f ${DEPLOYMENT_FILE} 
set +x
# Extract name from actual Kube deployment resource owning the deployed container image 
# Ensure that the image match the repository, image name and tag without the @ sha id part to handle
# case when image is sha-suffixed or not - ie:
# us.icr.io/sample/hello-containers-20190823092122682:1-master-a15bd262-20190823100927
# or
# us.icr.io/sample/hello-containers-20190823092122682:1-master-a15bd262-20190823100927@sha256:9b56a4cee384fa0e9939eee5c6c0d9912e52d63f44fa74d1f93f3496db773b2e
DEPLOYMENT_NAME_BACKEND=$(kubectl get deploy --namespace ${CLUSTER_NAMESPACE} -o json | jq -r '.items[] | select(.spec.template.spec.containers[]?.image | test("'"${IMAGE_BACKEND}"'(@.+|$)")) | .metadata.name' )
echo -e "CHECKING deployment rollout of ${DEPLOYMENT_NAME_BACKEND}"
echo ""
set -x
if kubectl rollout status deploy/${DEPLOYMENT_NAME_BACKEND} --watch=true --timeout=${ROLLOUT_TIMEOUT:-"150s"} --namespace ${CLUSTER_NAMESPACE}; then
  STATUS="pass"
else
  STATUS="fail"
fi
set +x


DEPLOYMENT_NAME_FRONTEND=$(kubectl get deploy --namespace ${CLUSTER_NAMESPACE} -o json | jq -r '.items[] | select(.spec.template.spec.containers[]?.image | test("'"${IMAGE_FRONTEND}"'(@.+|$)")) | .metadata.name' )
echo -e "CHECKING deployment rollout of ${DEPLOYMENT_NAME_FRONTEND}"
echo ""
set -x
if kubectl rollout status deploy/${DEPLOYMENT_NAME_FRONTEND} --watch=true --timeout=${ROLLOUT_TIMEOUT:-"150s"} --namespace ${CLUSTER_NAMESPACE}; then
  STATUS="pass"
else
  STATUS="fail"
fi
set +x


if [ "$STATUS" == "fail" ]; then
  echo "DEPLOYMENT FAILED"
  echo "Showing registry pull quota"
  ibmcloud cr quota || true
  exit 1
fi
# Extract app name from actual Kube pod 
# Ensure that the image match the repository, image name and tag without the @ sha id part to handle
# case when image is sha-suffixed or not - ie:
# us.icr.io/sample/hello-containers-20190823092122682:1-master-a15bd262-20190823100927
# or
# us.icr.io/sample/hello-containers-20190823092122682:1-master-a15bd262-20190823100927@sha256:9b56a4cee384fa0e9939eee5c6c0d9912e52d63f44fa74d1f93f3496db773b2e
echo "=========================================================="
APP_NAME_BACKEND=$(kubectl get pods --namespace ${CLUSTER_NAMESPACE} -o json | jq -r '[ .items[] | select(.spec.containers[]?.image | test("'"${IMAGE_BACKEND}"'(@.+|$)")) | .metadata.labels.app] [0]')
echo -e "APP: ${APP_NAME_BACKEND}"
echo "DEPLOYED PODS:"
kubectl describe pods --selector app=${APP_NAME_BACKEND} --namespace ${CLUSTER_NAMESPACE}

echo "=========================================================="
APP_NAME_FRONTEND=$(kubectl get pods --namespace ${CLUSTER_NAMESPACE} -o json | jq -r '[ .items[] | select(.spec.containers[]?.image | test("'"${APP_NAME_FRONTEND}"'(@.+|$)")) | .metadata.labels.app] [0]')
echo -e "APP: ${APP_NAME_FRONTEND}"
echo "DEPLOYED PODS:"
kubectl describe pods --selector app=${APP_NAME_FRONTEND} --namespace ${CLUSTER_NAMESPACE}

echo "=========================================================="
echo "DEPLOYMENT SUCCEEDED"

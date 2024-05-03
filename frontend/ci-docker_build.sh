#!/bin/bash

# this script picks up DATABASE_URL from the Travis environment

RED="0;31"
GREEN="0;32"

colorecho () {
	echo $(printf "\e[$1m$2\e[0m")
}

REGION="us-south"
RESOURCE_GROUP="AIX-HCAI-RIS3"
CONTAINER_REGION="us.icr.io"
IMAGE_TAG=${IMAGE_TAG}
BACKEND_API_HOST=${BACKEND_API_HOST}

echo "Downloading IBM Cloud CLI"

curl -fsSL https://clis.cloud.ibm.com/install/linux | sh

echo "Installing IBM Cloud Registry Service plugin"
bx plugin install container-registry
if [ $? -ne 0 ]; then
  echo $(printf "\e[31m**** Failed to install IBM Cloud Registry Service plugin ****\e[0m")
  exit 1
fi

colorecho $GREEN "building $IMAGE_TAG" 

bx login --apikey $BX_API_KEY -r $REGION -g $RESOURCE_GROUP
if [ $? -ne 0 ]; then
  colorecho $RED "failed to log in to IBM Cloud"
  exit 1
fi

ibmcloud cr login
if [ $? -ne 0 ]; then
  colorecho $RED "failed to log in to container registry"
  exit 1
fi

bx cr region-set $CONTAINER_REGION
if [ $? -ne 0 ]; then
  colorecho $RED "failed to target container region $CONTAINER_REGION"
  exit 1
fi



# build
echo "starting docker build:"
docker build --platform linux/amd64 \
-f $DOCKERFILE \
--build-arg NEXT_PUBLIC_BACKEND_API_HOST=$NEXT_PUBLIC_BACKEND_API_HOST \
--build-arg NEXTAUTH_SECRET=$NEXTAUTH_SECRET \
--build-arg NEXTAUTH_URL=$NEXTAUTH_URL \
--build-arg AUTH_PROVIDER_ID=$AUTH_PROVIDER_ID \
--build-arg AUTH_PROVIDER_NAME=$AUTH_PROVIDER_NAME \
--build-arg AUTH_WELL_KNOWN=$AUTH_WELL_KNOWN \
--build-arg AUTH_CLIENT_ID=$AUTH_CLIENT_ID \
--build-arg AUTH_CLIENT_SECRET=$AUTH_CLIENT_SECRET \
--build-arg NEXT_PUBLIC_USE_AUTH=$NEXT_PUBLIC_USE_AUTH \
. -t $IMAGE_TAG

if [ $? -ne 0 ]; then
  colorecho $RED "docker build failed"
  exit 1
fi

echo "pushing image $IMAGE_TAG:"
docker push $IMAGE_TAG
if [ $? -ne 0 ]; then
  colorecho $RED "failed to push the image"
  exit 1
fi

colorecho $GREEN "SUCCESS $IMAGE_TAG"

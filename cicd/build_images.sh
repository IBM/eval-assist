#!/bin/bash
# uncomment to debug the script
# set -x
# copy the script below into your app code repo (e.g. ./scripts/build_image_buildkit.sh) and 'source' it from your pipeline job
#    source ./scripts/build_image_using_buildkit.sh
# alternatively, you can source it from online script:
#    source <(curl -sSL "https://raw.githubusercontent.com/open-toolchain/commons/master/scripts/build_image_buildkit.sh")
# ------------------
# source: https://raw.githubusercontent.com/open-toolchain/commons/master/scripts/build_image_buildkit.sh
# fail the script if a command fails
set -eo pipefail

# This script does build a Docker image into IBM Container Service private image registry using Buildkit buildctl - https://github.com/moby/buildkit#building-a-dockerfile-with-buildctl
# Minting image tag using format: BUILD_NUMBER-BRANCH-COMMIT_ID-TIMESTAMP
# Also copies information into a build.properties file, so they can be reused later on by other scripts (e.g. image url, chart name, ...)

IMAGE_NAME_BACKEND="${IMAGE_NAME}-backend"
IMAGE_NAME_FRONTEND="${IMAGE_NAME}-frontend"
# Input env variables (can be received via a pipeline environment properties.file.
echo "REGISTRY_URL=${REGISTRY_URL}"
echo "REGISTRY_NAMESPACE=${REGISTRY_NAMESPACE}"
echo "IMAGE_NAME_BACKEND=${IMAGE_NAME_BACKEND}"
echo "IMAGE_NAME_FRONTEND=${IMAGE_NAME_FRONTEND}"
echo "BUILD_NUMBER=${BUILD_NUMBER}"
echo "ARCHIVE_DIR=${ARCHIVE_DIR}"
echo "GIT_BRANCH=${GIT_BRANCH}"
echo "GIT_COMMIT=${GIT_COMMIT}"
echo "DOCKER_ROOT=${DOCKER_ROOT}"
echo "DOCKER_FILE=${DOCKER_FILE}"

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

# To review or change build options use:
# ibmcloud cr build --help

# Minting image tag using format: BUILD_NUMBER-BRANCH-COMMIT_ID-TIMESTAMP
# e.g. 3-master-50da6912-20181123114435
# (use build number as first segment to allow image tag as a patch release name according to semantic versioning)
TIMESTAMP=$( date -u "+%Y%m%d%H%M%S")
IMAGE_TAG=${TIMESTAMP}
if [ ! -z "${GIT_COMMIT}" ]; then
  GIT_COMMIT_SHORT=$( echo ${GIT_COMMIT} | head -c 8 ) 
  IMAGE_TAG=${GIT_COMMIT_SHORT}-${IMAGE_TAG}
fi
if [ ! -z "${GIT_BRANCH}" ]; then IMAGE_TAG=${GIT_BRANCH}-${IMAGE_TAG} ; fi
IMAGE_TAG=${BUILD_NUMBER}-${IMAGE_TAG}

# Checking ig buildctl is installed
if which buildctl > /dev/null 2>&1; then
  buildctl --version
else 
  echo "Installing Buildkit builctl"
  curl -sL https://github.com/moby/buildkit/releases/download/v0.8.1/buildkit-v0.8.1.linux-amd64.tar.gz | tar -C /tmp -xz bin/buildctl && mv /tmp/bin/buildctl /usr/bin/buildctl && rmdir --ignore-fail-on-non-empty /tmp/bin
  buildctl --version
fi

# Create the config.json file to make private container registry accessible
export DOCKER_CONFIG=$(mktemp -d -t cr-config-XXXXXXXXXX)
kubectl create secret --dry-run=true --output=json \
  docker-registry registry-dockerconfig-secret \
  --docker-server=${REGISTRY_URL} \
  --docker-password=${IBM_CLOUD_API_KEY} \
  --docker-username=iamapikey --docker-email=a@b.com | \
jq -r '.data[".dockerconfigjson"]' | base64 -d > ${DOCKER_CONFIG}/config.json


echo "EXTRA_BUILD_ARGS: ${EXTRA_BUILD_ARGS}"
if [ -z "$EXTRA_BUILD_ARGS" ]; then
  echo -e ""
else
  for buildArg in $EXTRA_BUILD_ARGS; do
    if [ "$buildArg" == "--build-arg" ]; then
      echo -e ""
    else      
      BUILD_ARGS="${BUILD_ARGS} --opt build-arg:$buildArg"
    fi
  done
fi
set -x

set -x
echo "Building frontend image"
buildctl build \
    --frontend dockerfile.v0 --opt filename=${DOCKER_FILE} --local dockerfile=frontend \
    --local context=frontend \
    --opt build-arg:NEXT_PUBLIC_BACKEND_API_HOST=${NEXT_PUBLIC_BACKEND_API_HOST} \
    --output type=image,name="${REGISTRY_URL}/${REGISTRY_NAMESPACE}/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG}",push=true
echo "Building backend image"
buildctl build \
    --frontend dockerfile.v0 --opt filename=${DOCKER_FILE} --local dockerfile=backend \
    --local context=backend \
    --opt build-arg:USE_AUTH=${USE_AUTH} \
    --output type=image,name="${REGISTRY_URL}/${REGISTRY_NAMESPACE}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG}",push=true
set +x

echo "Images were pushed succesfully"

ibmcloud cr image-inspect ${REGISTRY_URL}/${REGISTRY_NAMESPACE}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG}
ibmcloud cr image-inspect ${REGISTRY_URL}/${REGISTRY_NAMESPACE}/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG}

echo "Backend images"
ibmcloud cr images --restrict ${REGISTRY_NAMESPACE}/${IMAGE_NAME_BACKEND}

echo "Frontend images"
ibmcloud cr images --restrict ${REGISTRY_NAMESPACE}/${IMAGE_NAME_FRONTEND}

######################################################################################
# Copy any artifacts that will be needed for deployment and testing to $WORKSPACE    #
######################################################################################
echo "=========================================================="
echo "COPYING ARTIFACTS needed for deployment and testing (in particular build.properties)"

echo "Checking archive dir presence"
if [ -z "${ARCHIVE_DIR}" ]; then
  echo -e "Build archive directory contains entire working directory."
else
  echo -e "Copying working dir into build archive directory: ${ARCHIVE_DIR} "
  mkdir -p ${ARCHIVE_DIR}
  find . -mindepth 1 -maxdepth 1 -not -path "./$ARCHIVE_DIR" -exec cp -R '{}' "${ARCHIVE_DIR}/" ';'
fi

# Load existing build.properties to preserve previous variables
BUILD_PROPERTIES_FILE="$ARCHIVE_DIR/build.properties"
if [ -f "$BUILD_PROPERTIES_FILE" ]; then
  echo "Loading existing build.properties"
  source "$BUILD_PROPERTIES_FILE"
else
  echo "No existing build.properties found. Creating a new one."
  touch "$BUILD_PROPERTIES_FILE"
fi

echo -e "This are the files present in ${BUILD_PROPERTIES_FILE} bofore adding new ones"
cat "$BUILD_PROPERTIES_FILE" | grep -v -i password

# Append new environment variables to build.properties
{
  echo "IMAGE_NAME_BACKEND=${IMAGE_NAME_BACKEND}"
  echo "IMAGE_NAME_FRONTEND=${IMAGE_NAME_FRONTEND}"
  echo "IMAGE_TAG=${IMAGE_TAG}"
  echo "REGISTRY_URL=${REGISTRY_URL}"
  echo "REGISTRY_NAMESPACE=${REGISTRY_NAMESPACE}"
  echo "GIT_BRANCH=${GIT_BRANCH}"
} >> "$BUILD_PROPERTIES_FILE"

ibmcloud cr image-digests --json --restrict ${REGISTRY_NAMESPACE}/${IMAGE_NAME_BACKEND} | jq -c '.[]' > list
TARGET_IMAGE_BACKEND=$(grep -F "${IMAGE_TAG}" list)
echo "TARGET_IMAGE_BACKEND $TARGET_IMAGE_BACKEND"

DIGEST_BACKEND=$(echo $TARGET_IMAGE_BACKEND | jq -r '.id')
echo "DIGEST_BACKEND $DIGEST_BACKEND"


ibmcloud cr image-digests --json --restrict ${REGISTRY_NAMESPACE}/${IMAGE_NAME_FRONTEND} | jq -c '.[]' > list
TARGET_IMAGE_FRONTEND=$(grep -F "${IMAGE_TAG}" list)
echo "TARGET_IMAGE_FRONTEND $TARGET_IMAGE_FRONTEND"

DIGEST_FRONTEND=$(echo $TARGET_IMAGE_FRONTEND | jq -r '.id')
echo "DIGEST_FRONTEND $DIGEST_FRONTEND"

# Append image digest information
{
  echo "IMAGE_MANIFEST_SHA_BACKEND=${DIGEST_BACKEND}"
  echo "IMAGE_BACKEND=${REGISTRY_URL}/${REGISTRY_NAMESPACE}/${IMAGE_NAME_BACKEND}@${DIGEST_BACKEND}"
  echo "IMAGE_MANIFEST_SHA_FRONTEND=${DIGEST_FRONTEND}"
  echo "IMAGE_FRONTEND=${REGISTRY_URL}/${REGISTRY_NAMESPACE}/${IMAGE_NAME_FRONTEND}@${DIGEST_FRONTEND}"
} >> "$BUILD_PROPERTIES_FILE"

# Display the final build.properties content (excluding sensitive data)
echo "File 'build.properties' updated with new environment variables:"
cat "$BUILD_PROPERTIES_FILE" | grep -v -i password

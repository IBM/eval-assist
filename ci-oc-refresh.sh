#!/bin/bash

RED="0;31"
GREEN="0;32"

colorecho () {
	echo $(printf "\e[$1m$2\e[0m")
}

# TODO: parameterize this so it becomes general: 
# pass in the value for PROJECT_NAME via environment vars etc.
PROJECT_NAME=${PROJECT_NAME}
OC_SERVER=${$OC_SERVER}

colorecho $GREEN "deleting all pods on $PROJECT_NAME" 

# install the oc command line tool
# see https://github.ibm.com/ete-tutorials/ci-cd-scripts/blob/master/functions.sh
colorecho $GREEN " attempting to install oc"
error_code=4
DIRECTORY='/tmp'
OC_URL='https://mirror.openshift.com/pub/openshift-v4/clients/ocp/4.11.52/openshift-client-linux.tar.gz'
REGION="us-south"
RESOURCE_GROUP="AIX-HCAI-RIS3"

# commenting the oc fetch stuff - i think the better approach is to use `bx oc`
[[ -d "${DIRECTORY}/bin" ]] || mkdir -p "${DIRECTORY}/bin"

echo "fetching oc binary"
curl -sL ${OC_URL} -o /tmp/openshift-client-linux.tar.gz ||
  utils::die "OpenShift download process failed!" ${error_code}

echo "unzipping oc binary"
gunzip /tmp/openshift-client-linux.tar.gz
tar -xvf /tmp/openshift-client-linux.tar -k oc

echo "copying oc binary to ${DIRECTORY}/bin"
cp oc "${DIRECTORY}/bin"

echo "setting oc permissions"
chmod +x "${DIRECTORY}/bin/oc"

echo "setting path"
[[ "${PATH}" == *"/tmp/bin"* ]] || PATH="/tmp/bin:$PATH"
echo "PATH is ${PATH}"

echo "Downloading IBM Cloud CLI"

curl -fsSL https://clis.cloud.ibm.com/install/linux | sh

echo "Installing IBM Cloud Container Service plugin"
bx plugin install container-service
if [ $? -ne 0 ]; then
  echo $(printf "\e[31m**** Failed to install IBM Cloud Container Service plugin ****\e[0m")
  exit 1
fi

bx login --apikey $BX_API_KEY -r $REGION -g $RESOURCE_GROUP
if [ $? -ne 0 ]; then
  colorecho $RED "failed to log in to IBM Cloud"
  exit 1
fi

oc login $OC_SERVER -u apikey -p $BX_API_KEY
if [ $? -ne 0 ]; then
  colorecho $RED "Failed to log in to OpenShift. Check for BX_API_KEY in the environment."
  exit 1
fi

echo "selecting project $PROJECT_NAME"
oc project $PROJECT_NAME

echo "deleting all pods"
oc delete pods --all

if [ $? -ne 0 ]; then
  colorecho $RED "Failed to delete all pods"
  exit 1
fi

colorecho $GREEN "SUCCESS deploying $PROJECT_NAME"


#!/bin/bash

RED="0;31"
GREEN="0;32"

colorecho () {
	echo $(printf "\e[$1m$2\e[0m")
}

# TODO: parameterize this so it becomes general: 
# pass in the value for PROJECT_NAME via environment vars etc.
PROJECT_NAME=${PROJECT_NAME}
OC_SERVER=${$OC_SERVER}

colorecho $GREEN "deleting all pods on $PROJECT_NAME" 

# install the oc command line tool
# see https://github.ibm.com/ete-tutorials/ci-cd-scripts/blob/master/functions.sh
colorecho $GREEN " attempting to install oc"
error_code=4
DIRECTORY='/tmp'
OC_URL='https://mirror.openshift.com/pub/openshift-v4/clients/ocp/4.11.52/openshift-client-linux.tar.gz'
REGION="us-south"
RESOURCE_GROUP="AIX-HCAI-RIS3"

# commenting the oc fetch stuff - i think the better approach is to use `bx oc`
[[ -d "${DIRECTORY}/bin" ]] || mkdir -p "${DIRECTORY}/bin"

echo "fetching oc binary"
curl -sL ${OC_URL} -o /tmp/openshift-client-linux.tar.gz ||
  utils::die "OpenShift download process failed!" ${error_code}

echo "unzipping oc binary"
gunzip /tmp/openshift-client-linux.tar.gz
tar -xvf /tmp/openshift-client-linux.tar -k oc

echo "copying oc binary to ${DIRECTORY}/bin"
cp oc "${DIRECTORY}/bin"

echo "setting oc permissions"
chmod +x "${DIRECTORY}/bin/oc"

echo "setting path"
[[ "${PATH}" == *"/tmp/bin"* ]] || PATH="/tmp/bin:$PATH"
echo "PATH is ${PATH}"

echo "Downloading IBM Cloud CLI"

curl -fsSL https://clis.cloud.ibm.com/install/linux | sh

echo "Installing IBM Cloud Container Service plugin"
bx plugin install container-service
if [ $? -ne 0 ]; then
  echo $(printf "\e[31m**** Failed to install IBM Cloud Container Service plugin ****\e[0m")
  exit 1
fi

bx login --apikey $BX_API_KEY -r $REGION -g $RESOURCE_GROUP
if [ $? -ne 0 ]; then
  colorecho $RED "failed to log in to IBM Cloud"
  exit 1
fi

oc login $OC_SERVER -u apikey -p $BX_API_KEY
if [ $? -ne 0 ]; then
  colorecho $RED "Failed to log in to OpenShift. Check for BX_API_KEY in the environment."
  exit 1
fi

echo "selecting project $PROJECT_NAME"
oc project $PROJECT_NAME

echo "deleting all pods"
oc delete pods --all

if [ $? -ne 0 ]; then
  colorecho $RED "Failed to delete all pods"
  exit 1
fi

colorecho $GREEN "SUCCESS deploying $PROJECT_NAME"

BACKEND_POD=$(oc get pods -n eval-assist-demo | grep 'backend' | head -n 1 | awk '{print $1}' )
oc cp eval-assist-demo/${BACKEND_POD}:/app/shared_volume/dev.db ./dev.db

BACKEND_POD=$(oc get pods -n eval-assist | grep 'backend' | head -n 1 | awk '{print $1}' )
until oc cp eval-assist/${BACKEND_POD}:/app/shared_volume/dev.db ./dev.db; do
  echo "Trying again"
  sleep 1
done

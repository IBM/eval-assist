BACKEND_POD=$(oc get pods -n eval-assist | grep 'backend' | awk '{print $1}' )
oc cp eval-assist/${BACKEND_POD}:/app/prisma/db/dev.db ./dev.db

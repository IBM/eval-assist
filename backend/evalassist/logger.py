import json
import time
from collections.abc import Callable

from fastapi import Request, Response
from fastapi.routing import APIRoute
from starlette.background import BackgroundTask

from .db_client import db

ignored_endpoints = [
    "/health/",
    "/evaluators/",
    "/criterias/",
    "/test_case/",
    "/user/",
    "/default-credentials/",
    "/benchmarks/",
]


def log_info(method, path, req_body, res_body, headers, runtime):
    record = {
        "path": path,
        "method": method,
        "timestamp": time.time(),
        "runtime": runtime,
    }
    if path in ignored_endpoints:
        return

    if req_body:
        req = json.loads(req_body.decode())
        if "llm_provider_credentials" in req:
            req["llm_provider_credentials"] = ""
        record["request"] = req

    if res_body:
        res = json.loads(res_body.decode())
        record["response"] = res

    if "user_id" in headers:
        record["user_id"] = int(headers.get("user_id"))

    db.logrecord.create(data={"data": json.dumps(record)})


class LoggingRoute(APIRoute):
    def get_route_handler(self) -> Callable:
        original_route_handler = super().get_route_handler()

        async def custom_route_handler(request: Request) -> Response:
            req_body = await request.body()
            start_timestamp = time.time()
            response = await original_route_handler(request)
            end_timestamp = time.time()
            runtime = round(end_timestamp - start_timestamp, 2)
            tasks = response.background

            request.headers
            task = BackgroundTask(
                log_info,
                request.method,
                request.url.path,
                req_body,
                response.body if hasattr(response, "body") else None,
                request.headers,
                runtime,
            )

            # check if the original response had background tasks already attached to it
            if tasks:
                tasks.add_task(task)  # add the new task to the tasks list
                response.background = tasks
            else:
                response.background = task

            return response

        return custom_route_handler

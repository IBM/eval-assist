import json
import time
from collections.abc import Callable
from datetime import datetime

from evalassist.model import LogRecord
from fastapi import Request, Response
from fastapi.routing import APIRoute
from sqlmodel import Session
from starlette.background import BackgroundTask

from .const import STORAGE_ENABLED
from .database import engine  # Assumes you have engine/session setup

ignored_endpoints = [
    "/health",
    "/evaluators/",
    "/criterias/",
    "/test_case/",
    "/user/",
    "/default-credentials/",
    "/benchmarks/",
    "/domains-and-personas/",
    "/feature-flags/",
    "/version/",
]

ignored_methods_per_endpoint = {"/test_case/": ["GET"]}


def log_info(method, path, req_body, res_body, headers, runtime):
    if not STORAGE_ENABLED:
        return

    if path in ignored_endpoints and (
        path not in ignored_methods_per_endpoint
        or method in ignored_methods_per_endpoint[path]
    ):
        return

    record = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "runtime": runtime,
    }

    if path != "/log_user_action/":
        # adapt non log user action endpoint calls
        record["action"] = f"{method} {path.replace('/', '')}"

        record_content = {}
        if req_body:
            req = json.loads(req_body.decode())
            if "llm_provider_credentials" in req:
                req["llm_provider_credentials"] = ""
            try:
                req["test_case"]["content"] = json.loads(req["test_case"]["content"])
            except Exception:  # nosec B110
                pass
            record_content["request"] = req

        if res_body:
            res = json.loads(res_body.decode())
            try:
                res["content"] = json.loads(res["content"])
            except Exception:  # nosec B110
                pass
            record_content["response"] = res

        record["content"] = record_content
    else:
        req = json.loads(req_body.decode())
        record["action"] = req["action"]
        record["content"] = req["content"]

    log_record = LogRecord(
        data=json.dumps(record), user_id=headers.get("user_id", None)
    )

    with Session(engine) as session:
        session.add(log_record)
        session.commit()


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

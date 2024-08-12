from fastapi import Response, Request
from starlette.background import BackgroundTask
from fastapi.routing import APIRoute
from typing import Callable
from .db_client import db
import json, time
import time

def log_info(method, path, req_body, res_body, headers, runtime):

    record = {        
        "path": path,
        "method": method,
        "timestamp": time.time(),
        "runtime": runtime
    }

    if req_body:
        req = json.loads(req_body.decode())
        if "bam_api_key" in req:
            req["bam_api_key"] = ""
        record["request"] = req
    
    if res_body:
        res = json.loads(res_body.decode())
        record["response"] = res

    if "user_id" in headers:
        record["user_id"] = int(headers.get("user_id"))

    db.logrecord.create(
        data={
            "data": json.dumps(record)
        }
    )


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
            task = BackgroundTask(log_info, request.method, request.url.path, req_body, response.body, request.headers, runtime)
            
            # check if the original response had background tasks already attached to it
            if tasks:
                tasks.add_task(task)  # add the new task to the tasks list
                response.background = tasks
            else:
                response.background = task
                
            return response
            
        return custom_route_handler
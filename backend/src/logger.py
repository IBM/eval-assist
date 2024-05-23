from fastapi import Response, Request
from starlette.background import BackgroundTask
from fastapi.routing import APIRoute
from typing import Callable
from .db_client import db
import json, time

def log_info(method, path, req_body, res_body):

    record = {        
        "path": path,
        "method": method,
        "timestamp": time.time()
    }

    if req_body:
        req = json.loads(req_body.decode())
        if "bam_api_key" in req:
            req["bam_api_key"] = ""
        record["request"] = req
    
    if res_body:
        res = json.loads(res_body.decode())
        record["response"] = res

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
            response = await original_route_handler(request)
            tasks = response.background

            task = BackgroundTask(log_info, request.method, request.url.path, req_body, response.body)
            
            # check if the original response had background tasks already attached to it
            if tasks:
                tasks.add_task(task)  # add the new task to the tasks list
                response.background = tasks
            else:
                response.background = task
                
            return response
            
        return custom_route_handler
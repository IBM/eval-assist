import functools
import time

"""
    Usage: wrap a function call with the log_runtime function to log its runtime
"""


def log_runtime(function):
    @functools.wraps(function)
    def wrapper(*args, **kwargs):
        start_time = time.time()

        res = function(*args, **kwargs)

        end_time = time.time()
        total_time = round(end_time - start_time, 2)

        print(
            f"{function.__name__} took {total_time} seconds, {round(total_time / 60, 2)} minutes"
        )

        return res

    return wrapper

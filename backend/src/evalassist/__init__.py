import logging

root_pkg_logger = logging.getLogger(__name__)
root_pkg_logger.propagate = False

# Stream handler (console)
stream_handler = logging.StreamHandler()
stream_handler.setLevel(logging.DEBUG)

formatter = logging.Formatter(
    "%(asctime)s - %(name)s - %(lineno)d - %(levelname)s - %(message)s"
)
stream_handler.setFormatter(formatter)
root_pkg_logger.addHandler(stream_handler)

# File handler
file_handler = logging.FileHandler("app.log", mode="a", encoding="utf-8")
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(formatter)
root_pkg_logger.addHandler(file_handler)

# Set logger level
root_pkg_logger.setLevel(logging.DEBUG)

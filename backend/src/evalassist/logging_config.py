import logging
import logging.config
import os
import pathlib

from evalassist.const import LOG_DIR


def configure_logging():
    handlers = ["console"]
    dict_config: dict = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s - %(name)s - %(lineno)d - %(levelname)s - %(message)s"
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": "INFO",  # or configurable via env / CLI flag
                "formatter": "standard",
                "stream": "ext://sys.stdout",
            },
        },
        "root": {"handlers": handlers, "level": "DEBUG", "propagate": False},
        # 👇 Add this
        "loggers": {
            "httpx": {
                "level": "WARNING",
                "handlers": [],
                "propagate": True,
            },
            "LiteLLM": {
                "level": "WARNING",
                "handlers": [],
                "propagate": True,
            },
            # Sometimes LiteLLM uses lowercase logger names:
            "litellm": {
                "level": "WARNING",
                "handlers": [],
                "propagate": True,
            },
        },
    }

    if LOG_DIR:
        pathlib.Path(LOG_DIR).mkdir(parents=True, exist_ok=True)
        handlers.append("file")
        dict_config["handlers"]["file"] = {
            "class": "logging.FileHandler",
            "level": "DEBUG",
            "formatter": "standard",
            "filename": os.path.join(LOG_DIR, "evalassist.log"),
            "encoding": "utf-8",
            "mode": "a",
        }

    logging.config.dictConfig(dict_config)

import logging

import click
import uvicorn
from evalassist.const import UVICORN_WORKERS

logger = logging.getLogger(__name__)


@click.group()
def cli():
    pass


@cli.command()
@click.option("--host", default="127.0.0.1", help="Host to bind to.")
@click.option("--port", default=8000, type=int, help="Port to bind to.")
@click.option("--reload", default=False, type=bool, help="Reload on changes.")
def serve(host: str, port: int, reload: bool):
    logger.info(f"Starting EvalAssist on host {host} and port {port}...")
    uvicorn.run(
        "evalassist.main:app",
        host=host,
        port=port,
        loop="asyncio",
        reload=reload,
        workers=UVICORN_WORKERS,
    )


@cli.command()
def version():
    click.echo("EvalAssist v0.1.11")


def main():
    cli()


if __name__ == "__main__":
    cli()

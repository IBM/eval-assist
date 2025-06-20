import click
import uvicorn


@click.group()
def cli():
    pass


@cli.command()
@click.option("--host", default="127.0.0.1", help="Host to bind to.")
@click.option("--port", default=8000, type=int, help="Port to bind to.")
@click.option("--reload", default=False, type=bool, help="Reload on changes.")
def serve(host: str, port: int, reload: bool):
    uvicorn.run(
        "evalassist.main:app", host=host, port=port, loop="asyncio", reload=reload
    )


@cli.command()
def version():
    click.echo("EvalAssist v0.1.8")


def main():
    cli()


if __name__ == "__main__":
    cli()

import click
import uvicorn


@click.group()
def cli():
    pass


@cli.command()
def serve():
    uvicorn.run("evalassist.main:app", host="127.0.0.1", port=8000)


@cli.command()
def version():
    click.echo("EvalAssist v0.1.2")


def main():
    cli()


if __name__ == "__main__":
    cli()

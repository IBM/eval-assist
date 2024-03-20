from prisma import Prisma, Json
import pandas as pd

def main():

    # Models
    # model_ids = [
    #     "ibm/falcon-40b-8lang-instruct",
    #     "google/flan-t5-xl",
    #     "google/flan-t5-xxl",
    #     "google/flan-ul2",
    #     "ibm/granite-13b-instruct-v1",
    #     "ibm/mpt-7b-instruct",
    #     "bigscience/mt0-xxl"
    # ]

    db = Prisma()

    # Sample dataset
    datasets = [
    {
        "name": "CNN Daily/Mail",
        "file": "./data/cnn_daily_mail.csv",
    },
    {
        "name": "CNN Daily/Mail 50",
        "file": "./data/cnn_daily_mail_50.csv",
    },
    {
        "name": "CNN Daily/Mail 20",
        "file": "./data/cnn_daily_mail_20.csv",
    }
    ]

    try:
        db.connect()

        for dataset in datasets:

            dataset_name = dataset["name"]
            dataset_file = dataset["file"]

            df = pd.read_csv(dataset_file)
            n_examples = len(df)
            column_names = list(df.columns.values)

            with db.tx() as transaction:

                dataset = db.dataset.upsert(
                    where={
                        "name": dataset_name
                    },
                    data={
                        "create": {                    
                            "name": dataset_name,
                            "num_examples": n_examples
                        },
                        "update": {                    
                            "name": dataset_name,
                            "num_examples": n_examples
                        },
                    })

                # Clean up any existing examples & input variables
                db.inputvariable.delete_many(
                    where={
                        "datasetId": dataset.id
                    }
                )

                db.datum.delete_many(
                    where={
                        "datasetId": dataset.id
                    }
                )

                db.inputvariable.create_many(
                    data=[{"name": cname, "datasetId": dataset.id} for cname in column_names]
                )

                datums = df.to_dict('records')
                db.datum.create_many(
                    data=[{"data": Json(d), "datasetId": dataset.id} for d in datums]
                )

    finally:
        db.disconnect()

if __name__ == "__main__":
    """ This is executed when run from the command line """
    main()
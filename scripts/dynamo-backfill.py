import json
import argparse
import boto3
from uuid import uuid4
from datetime import datetime

def write_items_to_dynamo(env_name, games):
    table_name = f"gametime-api-videogame-submissions-{env_name}"
    region = "us-east-1"

    print(f"Using environment: {env_name}")
    print(f"Target DynamoDB table: {table_name}")

    dynamodb = boto3.resource("dynamodb", region_name=region)
    table = dynamodb.Table(table_name)

    for game in games:
        timestamp = datetime.utcnow().isoformat() + 'Z'
        item = {
            "submissionId": str(uuid4()),
            "createdAt": timestamp,
            "updatedAt": timestamp,
            **game
        }
        print(f"Writing: {item['gameTitle']} ({item['userId']})")
        table.put_item(Item=item)

    print("All items inserted successfully.")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("env", help="Environment name (dev, prod, etc.)")
    args = parser.parse_args()

    with open("data.json", "r") as file:
        games = json.load(file)

    write_items_to_dynamo(args.env, games)

if __name__ == "__main__":
    main()

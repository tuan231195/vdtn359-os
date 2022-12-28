#!/bin/bash

echo "SETUP: Creating DynamoDB table idempotency"
awslocal dynamodb create-table \
    --table-name idempotency \
    --cli-input-json \
    file:///docker-entrypoint-initaws.d/idempotency.json

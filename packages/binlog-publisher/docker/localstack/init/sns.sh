awslocal sns create-topic --name direct-sns-destination --region ap-southeast-2
awslocal sqs create-queue --queue-name sns-sqs-subscription --region ap-southeast-2
awslocal sns subscribe --topic-arn arn:aws:sns:ap-southeast-2:000000000000:direct-sns-destination --protocol sqs --notification-endpoint arn:aws:sqs:ap-southeast-2:000000000000:sns-sqs-subscription --region ap-southeast-2

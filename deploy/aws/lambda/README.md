AWS Lambda
---
This document explains the steps to deploy `graffiticode/api` on AWS Lambda. To
get a first look at deploying an AWS Lambda function see this
[guide](https://docs.aws.amazon.com/lambda/latest/dg/with-userapp.html).

## Prerequisites
1. Install and configure the AWS cli [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)

## Setup the Execution Role
1. Navigate to this [guide](https://docs.aws.amazon.com/lambda/latest/dg/with-userapp.html)
and follow the instructions to `Create the Execution Role`.
1. Navigate to the created [execution role](https://console.aws.amazon.com/iam/home#/roles/lambda-cli-role)
and copy the `Role ARN`
1. Paste Role ARN copied from the previous step in the `--role` cli parameter
under the `create` target in the `deploy/aws/lambda/Makefile`
(ex. `--role arn:aws:iam::903691265300:role/lambda-cli-role`)

## Manage the Lambda function
1. To create the function, run `make -f deploy/aws/lambda/Makefile create`. <br />
   _NOTE: only need to run this once_
1. To update the function, run `make -f deploy/aws/lambda/Makefile update`. <br />
   _NOTE: do this whenever code is updated_

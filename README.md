# Setup AWS to support OIDC in Bitbucket and GitLab

Sets up the IAM provider and roles to allow GitLab and Bitbucket to connect without secrets

## Setup a new account

``` bash
yarn

export AWS_PROFILE=xxx-dev
ACCOUNT_NUMBER=$(aws sts get-caller-identity | jq -r .Account)

# First time
npx cdk --profile "$AWS_PROFILE" bootstrap aws://${ACCOUNT_NUMBER}/ap-southeast-2

# Every time
npx cdk diff
npx cdk deploy

# If you just want cloudformation
npx cdk synth GitlabOidcCdkStack  > gitlab.yaml
npx cdk synth BitbucketOidcCdkStack  > bitbucket.yaml

## GitLab Setup

Add something like this to the github CI config
NOTE: You should define ROLE_ARN in the project settings as the output from the cloudformation stack

```yaml
assume role:
  id_tokens:
    GITLAB_OIDC_TOKEN:
      aud: sts.amazonaws.com
  before_script:
    - >
      mkdir -p ~/.aws
      echo "${MY_OIDC_TOKEN}" > /tmp/web_identity_token
      echo -e "[profile oidc]\nrole_arn=${ROLE_ARN}\nweb_identity_token_file=/tmp/web_identity_token" > ~/.aws/config
  # NOTE: If any tooling doesn't support AWS config files then you can do the below to get env variables
  # before_script:
  #   - >
  #     export $(printf "AWS_ACCESS_KEY_ID=%s AWS_SECRET_ACCESS_KEY=%s AWS_SESSION_TOKEN=%s"
  #     $(aws sts assume-role-with-web-identity
  #     --role-arn ${ROLE_ARN}
  #     --role-session-name "GitLabRunner-${CI_PROJECT_ID}-${CI_PIPELINE_ID}"
  #     --web-identity-token ${GITLAB_OIDC_TOKEN}
  #     --duration-seconds 3600
  #     --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]'
  #     --output text))
  script:
    - aws sts get-caller-identity
```

## Bitbucket Setup

Get your domain and audience from Bitbucket and add them to the script

Add something like this to the Bitbucket pipeline
NOTE: You should define ROLE_ARN in the project settings as the output from the cloudformation stack

```yaml
pipelines:
  branches:
    main:
      - step:
          name: Configure AWS credentials
          oidc: true
          script:
            - export AWS_REGION=ap-southeast-2
            - export AWS_ROLE_ARN=${ROLE_ARN}
            - export AWS_WEB_IDENTITY_TOKEN_FILE=$(pwd)/web-identity-token
            - echo $BITBUCKET_STEP_OIDC_TOKEN > $(pwd)/web-identity-token
            - aws sts get-caller-identity
```

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

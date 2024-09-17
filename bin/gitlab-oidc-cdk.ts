#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { GitlabOidcCdkStack } from '../lib/gitlab-oidc-cdk-stack';

const app = new cdk.App();
new GitlabOidcCdkStack(app, 'GitlabOidcCdkStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

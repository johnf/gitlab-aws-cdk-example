import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import * as iam from 'aws-cdk-lib/aws-iam';
import { CfnOIDCProvider } from 'aws-cdk-lib/aws-iam';

export class GitlabOidcCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // NOTE: This uses a custom lambda so we are switching to L1
    // const provider = new iam.OpenIdConnectProvider(this, 'GitLabOidcProvider', {
    //   url: 'https://gitlab.com',
    //   clientIds: ['sts.amazonaws.com'],
    // });

    const provider = new CfnOIDCProvider(this, 'GitLabOidcProvider', {
      url: 'https://gitlab.com',
      clientIdList: ['sts.amazonaws.com'],
    });
    const providerArn = cdk.Token.asString(provider.ref);

    const org = 'orgname';
    const repo = 'app';
    const branch = 'dev';
    const sub = `${org}/${repo}:ref_type:branch:ref:${branch}`;
    // Or you can allow all branches
    // const sub = `${org}/${repo}:*`;

    const role = new iam.Role(this, 'GitLabOidcRole', {
      assumedBy: new iam.WebIdentityPrincipal(providerArn, {
        StringEquals: {
          'gitlab.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          'gitlab.com:sub': sub,
        },
      }),
      roleName: 'GitlabOidcRole',
    });

    const policy = new iam.ManagedPolicy(this, 'GitLabPipelineDeploymentPolicy', {
      description: 'Git Lab Pipeline Deployment Policy',
      managedPolicyName: 'GitLabPipelineDeploymentPolicy',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          // TODO: Add any actions you need to work in Gitlab here
          actions: [
            'cloudformation:DescribeChangeSet',
            'cloudformation:DescribeStackEvents',
            'cloudformation:DescribeStackResource',
            'cloudformation:DescribeStackResources',
            'cloudformation:DescribeStackSet',
            'cloudformation:DescribeStackSetOperation',
            'cloudformation:DescribeStacks',
            'cloudformation:GetTemplate',
            'cloudformation:GetTemplateSummary',
            'cloudformation:ListStackResources',
            'cloudfront:CreateInvalidation',
            'iam:GetPolicy',
            'iam:GetRole',
            'iam:GetRolePolicy',
            'iam:GetUser',
            'iam:ListAttachedRolePolicies',
            'iam:ListPolicyVersions',
            'iam:PassRole',
            'iam:PutRolePermissionsBoundary',
            'iam:PutRolePolicy',
            'logs:DescribeLogStreams',
            'logs:GetLogEvents',
            's3:GetBucketLocation',
            's3:GetObject',
            's3:HeadBucket',
            's3:ListAllMyBuckets',
            's3:ListBucket',
            's3:ListBucketVersions',
            's3:PutObject',
          ],
          resources: ['*'],
        }),
      ],
    });
    role.addManagedPolicy(policy);

    // Output the Role ARN for reference
    new cdk.CfnOutput(this, 'GitLabRoleArn', {
      value: role.roleArn,
      description: 'The ARN of the IAM role for GitLab CI/CD',
    });
  }
}

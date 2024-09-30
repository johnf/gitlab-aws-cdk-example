import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import * as iam from 'aws-cdk-lib/aws-iam';
import { CfnOIDCProvider } from 'aws-cdk-lib/aws-iam';

export class BitbucketOidcCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // NOTE: This uses a custom lambda so we are switching to L1
    // const provider = new iam.OpenIdConnectProvider(this, 'GitLabOidcProvider', {
    //   url: 'https://gitlab.com',
    //   clientIds: ['sts.amazonaws.com'],
    // });

    // Your bitbucket workspace name
    const workspace = 'WORKSPACE_FIXME';
    // Your audience from the OpenIs Connect tab in bitbucket
    const audience = 'ari:cloud:bitbucket::workspace/WORKSPACE_UUID_FIXME';

    const domainName = `api.bitbucket.org/2.0/workspaces/${workspace}/pipelines-config/identity/oidc`;

    const provider = new CfnOIDCProvider(this, 'GitLabOidcProvider', {
      url: `https://${domainName}`,
      clientIdList: [audience],
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
          [`${domainName}:aud`]: audience,
        },
      }),
      roleName: 'BitbucketOidcRole',
    });

    const policy = new iam.ManagedPolicy(this, 'GitLabPipelineDeploymentPolicy', {
      description: 'Git Lab Pipeline Deployment Policy',
      managedPolicyName: 'GitLabPipelineDeploymentPolicy',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          // TODO: Add any actions you need to work in Bitbucket here
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
    new cdk.CfnOutput(this, 'BitbucketRoleArn', {
      value: role.roleArn,
      description: 'The ARN of the IAM role for Bitbucket CI/CD',
    });
  }
}

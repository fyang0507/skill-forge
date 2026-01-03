---
name: amazon-cognito-authentication
description: Use Amazon Cognito for user authentication and authorization in web and mobile applications.
---
# Amazon Cognito Authentication

## Key Learnings
*   **User Pools vs. Identity Pools:** Understand the distinction. User Pools handle user registration, sign-in, and authentication, acting as a user directory. Identity Pools provide temporary AWS credentials to users so they can access AWS resources directly.
*   **Authentication Flow:** Cognito handles multi-step authentication, including third-party logins, MFA challenges, and token issuance. Your application processes the resulting tokens or credentials.
*   **Hosted UI:** Cognito provides a hosted UI for sign-up and sign-in, simplifying the integration process.
*   **JWT Tokens:** Cognito issues standard JWT (ID, Access, and Refresh) tokens following OAuth 2.0 and OpenID Connect specifications. Use these tokens to control access to your application's resources.
*   **Multi-Factor Authentication (MFA):** Enforce an extra layer of security using MFA, with options for SMS one-time passcodes, TOTP from authenticator apps, or email one-time codes.
*   **Custom Attributes:** Define custom attributes in User Pools to collect unique information from users during registration.
*   **Lambda Triggers:** Integrate AWS Lambda to trigger custom logic during user pool operations, such as pre-sign-up or post-confirmation.

## Common Gotchas
*   **Multi-Region Support:** Cognito doesn't natively support multi-region synchronization. Implementing this requires custom solutions using DynamoDB and Lambda.
*   **Initial Learning Curve:** Cognito can be confusing initially due to concepts like User Pools vs. Identity Pools. Clear understanding of these components is crucial for effective use.
*   **Password Verification with MFA:** If MFA is enforced, Cognito may treat password verification and SMS MFA as one challenge, potentially causing unexpected behavior.
*   **Messaging Limitations:** The built-in messaging service has limitations, such as a restricted number of emails per day. Consider configuring Amazon SES for higher limits.
*   **Client Secrets in Public Clients:** Avoid embedding client secrets in public client software, as they are vulnerable to inspection and misuse. Implement client secrets only when the application is the sole entity with access to the secret.
*   **Pricing Complexity:** AWS Cognito pricing can be complex and potentially costly. It includes three core tiers for pricing: Lite, Essentials, and Plus.

## Working Pattern
1.  **Choose User Pools or Identity Pools:** Determine whether you need to manage user identities (User Pools) or grant access to AWS resources (Identity Pools).
2.  **Configure User Pool:** Create a User Pool, define user attributes, and set up sign-in options (username, email, phone number).
3.  **Implement Authentication Flow:** Use the Cognito SDK or AWS Amplify to implement the authentication flow in your application. You can use the hosted UI or create a custom UI using the AWS SDK.
4.  **Integrate with Identity Providers:** Integrate with social identity providers (Google, Facebook, Apple) or enterprise identity providers (SAML, OpenID Connect).
5.  **Secure API Gateway:** Configure a Cognito Authorizer on API Gateway to validate User Pool tokens attached to incoming API requests.
6.  **Implement MFA:** Enable and configure multi-factor authentication (MFA) for enhanced security. Options include SMS-based MFA, TOTP apps or Email codes.
7.  **Monitor and Manage:** Monitor user activity, track configuration changes using AWS CloudWatch Logs and AWS Config.
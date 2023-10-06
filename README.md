# evo-oauth2

`evo-oauth2` is a comprehensive TypeScript/JavaScript module designed to simplify the integration with OAuth 2.0 providers. Whether you're aiming to generate authorization URLs, fetch tokens using authorization codes, or manage refresh tokens, this module has got you covered.

## Features

- **Configurable OAuth2 Provider Settings**: The module allows you to easily configure various OAuth 2.0 provider settings using the `OAuth2ProviderConfiguration` interface.
- **Token Management**: Effortlessly fetch and manage access tokens and refresh tokens with the provided `OAuth2Client` class.
- **User Profile Retrieval**: Extract user profile information after successful authentication.
- **Built-in Default Configurations**: Comes with a default configuration that can be easily overridden based on your needs.
- **Token Refresh Callback**: Handle token refreshing seamlessly with the `RefreshTokenCallback`.

## Getting Started

To use `evo-oauth2`, import the necessary components from the module and configure them based on your OAuth 2.0 provider's requirements.

```typescript
import { OAuth2Client, OAuth2ProviderConfiguration } from 'evo-oauth2';

const myConfig: OAuth2ProviderConfiguration = {
    // ... your configuration here
};

const client = new OAuth2Client(myConfig);
```

For more detailed documentation on each function and type, please refer to the respective files.
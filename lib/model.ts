export interface OAuth2ProviderConfiguration {
    providerName: string;
    clientId: string;
    clientSecret: string;
    authHost: string;
    tokenHost?: string;
    authUri: string;
    tokenUri: string;
    clientIdName?: string;
    clientSecretName?: string;
    scope: string[];
    scopeSeparator?: string;
    redirectName?: string;
    method?: 'post' | 'get';
    authMode?: 'header' | 'params';
    profileUrl?: string;
    authMethod: OAuth2AuthorizationMethod;
}

export interface TokenData {
    refresh_token?: string;
    access_token?: string;
    expires_in?: number;
    token_type: string;
    scope?: string;
    id_token?: string;
    expire_at?: string;
}

export interface OAuth2Profile {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    picture?: string;
    name?: string;
}

export type OAuth2GrantType = 'authorization_code' | 'token' | 'password' | 'client_credentials' | 'refresh_token';
export type OAuth2ResponseType = 'code' | 'token';
export type OAuth2AuthorizationMethod = 'header' | 'form-encoded' | 'uri-query';
export type ResourceRequestMethod = 'post' | 'get';
export type SupportedOAuth2Provider = 'google' | 'facebook' | 'strava';
export type OAuth2Provider = SupportedOAuth2Provider | OAuth2ProviderConfiguration;

export function getConfigurationByProvider(provider: SupportedOAuth2Provider, clientId: string, clientSecret: string): OAuth2ProviderConfiguration {
    switch (provider) {
        case 'google':
            return {
                providerName: 'google',
                clientId: clientId,
                clientSecret: clientSecret,
                authHost: 'https://accounts.google.com',
                tokenHost: 'https://www.googleapis.com',
                authUri: '/o/oauth2/v2/auth',
                tokenUri: '/oauth2/v4/token',
                scope: ['openid', 'profile', 'email'],
                scopeSeparator: ' ',
                method: 'post',
                profileUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
                authMethod: 'header'
            };
        case 'facebook':
            return {
                providerName: 'facebook',
                clientId: clientId,
                clientSecret: clientSecret,
                authHost: 'https://www.facebook.com',
                tokenHost: 'https://graph.facebook.com',
                authUri: '/v17.0/dialog/oauth',
                tokenUri: '/v17.0/oauth/access_token',
                scope: [],
                method: 'get',
                profileUrl: 'https://graph.facebook.com/me',
                authMethod: 'header'
            }
        case 'strava':
            return {
                providerName: 'strava',
                clientId: clientId,
                clientSecret: clientSecret,
                authHost: 'https://www.strava.com',
                authUri: '/oauth/authorize',
                tokenUri: '/api/v3/oauth/token',
                scope: ['profile:read_all', 'activity:read_all'],
                scopeSeparator: ',',
                method: 'post',
                profileUrl: 'https://www.strava.com/api/v3/athlete',
                authMethod: 'header'
            }
    }
}
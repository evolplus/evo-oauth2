import axios from 'axios';
import { OAuth2GrantType, OAuth2Profile, OAuth2ProviderConfiguration, OAuth2ResponseType, ResourceRequestMethod, TokenData } from "./model";

const DEFAULT_CONFIG: OAuth2ProviderConfiguration = {
    providerName: '',
    clientId: '',
    clientSecret: '',
    authHost: '',
    authUri: '/oauth/authorize',
    scope: [],
    tokenUri: '/oauth/token',
    clientIdName: 'client_id',
    clientSecretName: 'client_secret',
    scopeSeparator: ',',
    redirectName: 'redirect_uri',
    method: 'post',
    authMethod: 'header'
};

export type RefreshTokenCallback = (oldToken: TokenData, refreshedToken: TokenData) => void;

export class OAuth2Error extends Error {
    status?: number;
}

export class OAuth2Client {
    private config: OAuth2ProviderConfiguration;
    private scope: string;
    refreshCallback?: RefreshTokenCallback;

    constructor(config: OAuth2ProviderConfiguration) {
        this.config = Object.assign({}, DEFAULT_CONFIG, config);
        if (!this.config.tokenHost) {
            this.config.tokenHost = this.config.authHost;
        }
        this.scope = this.config.scope.join(this.config.scopeSeparator);
    }

    generateAuthorizeUrl(redirectUrl: string, state?: string, responseType: OAuth2ResponseType = 'code') {
        return `${this.config.authHost}${this.config.authUri}?${this.config.clientIdName}=${encodeURIComponent(this.config.clientId)}&scope=${this.scope}&${this.config.redirectName}=${encodeURIComponent(redirectUrl)}&response_type=${responseType}${state ? '&state=' + state : ''}`;
    }

    refineToken(token: TokenData): TokenData {
        let copy: TokenData = Object.assign({}, token);
        if (copy.expires_in && !copy.expire_at) {
            copy.expire_at = new Date(Date.now() + token.expires_in! * 1000).toISOString();
        }
        return copy;
    }

    async exchangeToken(code: string, grantType: OAuth2GrantType = 'authorization_code', redirectUri?: string): Promise<TokenData> {
        let url = `${this.config.tokenHost}${this.config.tokenUri}`,
            options: any = {},
            params: any = {
                grant_type: grantType,
                scope: this.scope,
                code: code,
            };
        if (redirectUri) {
            params.redirect_uri = redirectUri;
        }
        if (this.config.authMode == "header") {
            options.auth = {
                username: this.config.clientId,
                password: this.config.clientSecret
            };
        } else {
            params[this.config.clientIdName!] = this.config.clientId;
            params[this.config.clientSecretName!] = this.config.clientSecret;
        }
        let resp;
        if (this.config.method == "post") {
            options.headers = { 'content-type': 'application/x-www-form-urlencoded' };
            resp = await axios.post(url, params, options);
        } else {
            options.params = params;
            resp = await axios.get(url, options);
        }
        return this.refineToken(resp.data as TokenData);
    }

    async extractIdToken(token: TokenData): Promise<OAuth2Profile> {
        if (!token.id_token) {
            throw "id_token is not found.";
        }
        let parts = token.id_token.split("."),
            buff = Buffer.from(parts[1], 'base64'),
            id_token = JSON.parse(buff.toString('ascii'));
        return {
            sub: id_token.sub,
            email: id_token.sub,
            email_verified: id_token.email_verified,
            picture: id_token.picture,
            name: id_token.name
        }
    }

    async refreshToken(token: TokenData): Promise<TokenData> {
        if (!token.refresh_token) {
            throw "refresh_token is not found.";
        }
        let url = `${this.config.tokenHost}/${this.config.tokenUri}`,
            options: any = {},
            params: any = {
                grant_type: "refresh_token",
                scope: this.scope,
                refresh_token: token.refresh_token,
            };
        if (this.config.authMode == "header") {
            options.auth = {
                username: this.config.clientId,
                password: this.config.clientSecret
            };
        } else {
            params[this.config.clientIdName!] = this.config.clientId;
            params[this.config.clientSecretName!] = this.config.clientSecret;
        }
        let resp;
        if (this.config.method == "post") {
            options.headers = { 'content-type': 'application/x-www-form-urlencoded' };
            resp = await axios.post(url, params, options);
        } else {
            options.params = params;
            resp = await axios.get(url, options);
        }
        let refreshed = this.refineToken(resp.data as TokenData);
        if (this.refreshCallback) {
            this.refreshCallback(token, refreshed);
        }
        return refreshed;
    }

    async getResource(url: string, params: any, token: TokenData, reqMethod?: ResourceRequestMethod): Promise<any> {
        if (token.expire_at && new Date(token.expire_at).getTime() < Date.now()) {
            token = await this.refreshToken(token);
        }
        if (token.token_type.toLowerCase() != "bearer") {
            throw "Unsupported token_type.";
        }
        let headers: any = {}, data: any = {};
        if (this.config.authMethod == 'header') {
            headers['Authorization'] = `Bearer ${token.access_token}`;
        } else {
            data.access_token = token.access_token!;
        }
        if (!reqMethod) {
            reqMethod = this.config.method;
        }
        if ((reqMethod == "post" && this.config.authMethod == "uri-query") ||
            (reqMethod == "get" && this.config.authMethod == "form-encoded")) {
            throw "Invalid combination of request method and authorization method.";
        }
        let resp;
        if (reqMethod == "get") {
            resp = await axios.get(url, {
                headers: headers,
                params: params
            });
        } else {
            resp = await axios.post(url, params, {
                headers: headers
            });
        }
        if (resp.status == 200) {
            return resp.data;
        }
        let error = new OAuth2Error(`Error get resource with status code ${resp.status}. Data: ${JSON.stringify(resp.data)}.`);
        error.name = 'ResourceError';
        error.status = resp.status;
        throw error;
    }

    async getProfile(token: TokenData, url?: string, params?: any, reqMethod?: ResourceRequestMethod): Promise<OAuth2Profile> {
        if ('id_token' in token) {
            try {
                return await this.extractIdToken(token);
            } catch (e) {
            }
        }
        if (!url) {
            url = this.config.profileUrl;
        }
        if (!url) {
            throw "Neither id_token nor url provided.";
        }
        let profile = await this.getResource(url, params, token, reqMethod);
        if (profile.id && !profile.sub) {
            profile.sub = profile.id;
        }
        return profile as OAuth2Profile;
    }
}
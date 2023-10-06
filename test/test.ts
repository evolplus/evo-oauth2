import * as oauth2 from '..';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const HOST = "http://localhost:8888";

let app = express(),
    googleClient = new oauth2.OAuth2Client(oauth2.getConfigurationByProvider('google', process.env.GOOGLE_CLIENT_ID!, process.env.GOOGLE_CLIENT_SECRET!)),
    facebookClient = new oauth2.OAuth2Client(oauth2.getConfigurationByProvider('facebook', process.env.FACEBOOK_CLIENT_ID!, process.env.FACEBOOK_CLIENT_SECRET!));

app.get('/auth/google', (req: Request, res: Response) => {
    res.redirect(googleClient.generateAuthorizeUrl(`${HOST}/auth/google/callback`));
    res.end();
});
app.get('/auth/google/callback', async (req: Request, res: Response) => {
    let code = req.query.code! as string,
        token = await googleClient.exchangeToken(code, "authorization_code", `${HOST}/auth/google/callback`),
        profile = await googleClient.getProfile(token);
    res.write(JSON.stringify(profile));
    res.end();
});

app.get('/auth/facebook', (req: Request, res: Response) => {
    res.redirect(facebookClient.generateAuthorizeUrl(`${HOST}/auth/facebook/callback`, 'hihihaha'));
    res.end();
});
app.get('/auth/facebook/callback', async (req: Request, res: Response) => {
    let code = req.query.code! as string,
        token = await facebookClient.exchangeToken(code, "authorization_code", `${HOST}/auth/facebook/callback`),
        profile = await facebookClient.getProfile(token);
    res.write(JSON.stringify(profile));
    res.end();
});
app.listen(8888);
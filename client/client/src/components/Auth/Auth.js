import auth0 from 'auth0-js';
import { AUTH_CONFIG } from './auth0-variables';
import history from '../../history';
import API from '../../utils/API';

export default class Auth {
    auth0 = new auth0.WebAuth({
        domain: AUTH_CONFIG.domain,
        clientID: AUTH_CONFIG.clientId,
        redirectUri: AUTH_CONFIG.callbackUrl,
        audience: `https://${AUTH_CONFIG.domain}/userinfo`,
        responseType: 'token id_token',
        scope: 'openid profile'
    });

    userProfile;

    constructor() {
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);
        this.handleAuthentication = this.handleAuthentication.bind(this);
        this.isAuthenticated = this.isAuthenticated.bind(this);
        this.getAccessToken = this.getAccessToken.bind(this);
        this.getProfile = this.getProfile.bind(this);
        this.grabInfo = this.grabInfo.bind(this);
    }

    login() {
        this.auth0.authorize();
    }

    handleAuthentication() {
        this.auth0.parseHash((err, authResult) => {
            if (authResult && authResult.accessToken && authResult.idToken) {
                this.setSession(authResult);
                history.replace('/home');
            } else if (err) {
                history.replace('/home');
                console.log(err);
                alert(`Error: ${err.error}. Check the console for further details.`);
            }
        });
    }

    setSession(authResult) {
        // Set the time that the access token will expire at
        let expiresAt = JSON.stringify(authResult.expiresIn * 1000 + new Date().getTime());
        //testing:
        console.log('(client side)this is user info:' + JSON.stringify(authResult));

        localStorage.setItem('access_token', authResult.accessToken);
        localStorage.setItem('id_token', authResult.idToken);
        localStorage.setItem('expires_at', expiresAt);
        // navigate to the home route
        history.replace('/home');
        //API user info

        let name=authResult.idTokenPayload.name;
        let email=" ";
        var n = name.search("@");
        if (n === 0){
            email=authResult.idTokenPayload.nickname + '@gmail.com'
            console.log("token email: ", email);
        } else {
            email=authResult.idTokenPayload.name
            console.log("token email: ", email);
        }

        API.createUser({
            name: authResult.idTokenPayload.name,
            email: email,
            picture: authResult.idTokenPayload.picture
        })
            .then(res => console.log(`user has  been inserted in database`))
            .catch(err => console.log);
    }

    grabInfo() {
        const userInfo = {
            name: this.userProfile.name,
            email: this.userProfile.nickname + '@gmail.com',
            picture: this.userProfile.picture
        };
        return userInfo;
    }
    getAccessToken() {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            throw new Error('No access token found');
        }
        return accessToken;
    }

    getProfile(cb) {
        let accessToken = this.getAccessToken();
        this.auth0.client.userInfo(accessToken, (err, profile) => {
            if (profile) {
                this.userProfile = profile;
            }
            cb(err, profile);
        });
    }

    logout() {
        // Clear access token and ID token from local storage
        localStorage.removeItem('access_token');
        localStorage.removeItem('id_token');
        localStorage.removeItem('expires_at');
        this.userProfile = null;
        // navigate to the home route
        history.replace('/home');
    }

    isAuthenticated() {
        // Check whether the current time is past the
        // access token's expiry time
        let expiresAt = JSON.parse(localStorage.getItem('expires_at'));
        return new Date().getTime() < expiresAt;
    }
}



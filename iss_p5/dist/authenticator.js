"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authenticator = void 0;
class Authenticator {
    constructor() {
        this._authenticated = false;
        this._authenticationInfo = { phoneNumber: '' };
    }
    addExistingAuthenticationInfo(message) {
        if (this.isAuthenticated()) {
            message.authenticationInfo = this._authenticationInfo;
            return true;
        }
        return false;
    }
    isAuthenticated() {
        return this._authenticated;
    }
    authenticate(authenticationInfo) {
        this._authenticated = true;
        this._authenticationInfo = authenticationInfo;
    }
    get authenticationInfo() {
        return this._authenticationInfo;
    }
    disableAuthentication() {
        this._authenticated = false;
        this._authenticationInfo = { phoneNumber: '' };
    }
}
exports.Authenticator = Authenticator;

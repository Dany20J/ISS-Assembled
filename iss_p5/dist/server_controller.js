"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerController = void 0;
const ws_1 = __importDefault(require("ws"));
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const event_handler_1 = require("./handler/event_handler");
const sockets_state_handler_1 = require("./handler/sockets_state_handler");
const account_1 = require("./account/account");
const account_repository_1 = require("./account/account_repository");
const websocket_info_manager_1 = require("./websocket_manager/websocket_info_manager");
const authenticator_1 = require("./websocket_manager/authenticator");
const account_services_handler_1 = require("./handler/account_services_handler");
const message_destination_handler_1 = require("./handler/message_destination_handler");
const authentication_handler_1 = require("./handler/authentication_handler");
const chat_services_handler_1 = require("./handler/chat_services_handler");
const chat_1 = require("./chat/chat");
const chat_repository_1 = require("./chat/chat_repository");
const authenticator_repository_1 = require("./websocket_manager/authenticator_repository");
const node_fetch_1 = __importDefault(require("node-fetch"));
const shared_functions_1 = require("./shared_functions/shared_functions");
class ServerController {
    constructor() {
        this._primsa = new client_1.PrismaClient();
        this._authRep = new authenticator_repository_1.AuthenticatorRepository();
        this._authRep.setCAPublicKey('-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA11Tbvr5fALpPrmE3lGRa\ny26+j/WdKOPV28iUQMcnYlkl7t1oHyB5i2ugCoUX6u7W0yLxWv8Pj+mmFuIXbqkz\nT/8CraAhLh7+7a3gvDLu2iJkI04y2Ro94qIeOaK0ybZSUbkWCrbkocQWfZUc5izC\nWuIhdMLN0o64pmQYjywTqkY10hzvQW8MuwBQY83tlqnRuSrUfMARnIk/m8XdLCPx\nCqijo3RK7S3A4d/LPrh7sG+ahfKY5PNKeeVfMs70oW9xXbUXutx/BXG2JEzCZB+2\nFSFYkmj+1fmCXz49nKDNVwu6upK/QZn8t9zjI/2/OkcXpMPtNa8564+qvdp9eLUU\njwIDAQAB\n-----END PUBLIC KEY-----\n');
        this.initializeCertificate();
        this._account = new account_1.Account(new account_repository_1.AccountRepository(), 5, this._authRep, new authenticator_1.Authenticator(this._authRep, this._serverKeyPair));
        this._chat = new chat_1.Chat(new chat_repository_1.ChatRepository());
        this._messageDestinationHandler = new message_destination_handler_1.MessageDestinationHandler();
        this._accountServicesHandler = new account_services_handler_1.AccountServicesHandler(this._account, this._messageDestinationHandler);
        this._authenticationHandler = new authentication_handler_1.AuthenticationHandler(this._messageDestinationHandler, this._authRep);
        this._chatServicesHandler = new chat_services_handler_1.ChatServicesHandler(this._chat, this._messageDestinationHandler);
        this._eventToMsg = new Map();
        this._eventToMsg.set('signIn', [this._accountServicesHandler]);
        this._eventToMsg.set('signUp', [this._accountServicesHandler]);
        this._eventToMsg.set('signOut', [this._authenticationHandler]);
        this._eventToMsg.set('getCertificate', [this._authenticationHandler]);
        this._eventToMsg.set('setSessionKey', [this._authenticationHandler]);
        this._eventToMsg.set('getSomeCertificate', [this._authenticationHandler]);
        this._eventToMsg.set('chatSubscription', [this._chatServicesHandler]);
        this._eventToMsg.set('chatUnSubscription', [this._chatServicesHandler]);
        this._eventToMsg.set('getChatsHistory', [this._chatServicesHandler]);
        this._eventToMsg.set('getMessagesHistory', [this._chatServicesHandler]);
        this._eventToMsg.set('sendMessage', [this._chatServicesHandler]);
        this._eventToMsg.set('state', [this._chatServicesHandler]);
        this._eventHandler = new event_handler_1.EventHandler(this._eventToMsg);
        this._socketsStateHandler = new sockets_state_handler_1.SocketsStateHandler();
        this._socketsStateHandler.addListener(this._eventHandler);
        this._app = (0, express_1.default)();
        this._app.use(express_1.default.json());
        this._httpServer = http_1.default.createServer(this._app);
        this._server = new ws_1.default.Server({ server: this._httpServer });
    }
    async initializeCertificate() {
        this._serverKeyPair = await (this._authRep.getServerPairKey());
        await this.certifyServerPublicKey();
    }
    async certifyServerPublicKey() {
        if (await this._authRep.getServerCertificate() != null)
            return;
        console.log('NO cert');
        let dataToSend = JSON.stringify({
            phoneNumber: '0000000000',
            publicKey: this._serverKeyPair?.serverPublicKey
        });
        let response = await (0, node_fetch_1.default)('http://localhost:8999/post-csr', {
            method: 'POST',
            body: dataToSend,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        let incomingData = (await response.json());
        if (response.ok && incomingData.successful) {
            console.log("Loop");
            this.getCertLoop();
        }
    }
    async getCertLoop() {
        while (true) {
            let dataToSend = JSON.stringify({
                phoneNumber: '0000000000',
            });
            let response = await (0, node_fetch_1.default)('http://localhost:8999/get-cert', {
                method: 'POST',
                body: dataToSend,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            let incomingData = (await response.json());
            if (incomingData.successful) {
                let caCert = incomingData.cert;
                let certificateInfoStr = (caCert?.signatureData);
                if ((new authenticator_1.Authenticator(this._authRep, this._serverKeyPair).verifiyCertificate({
                    certificateInfo: JSON.parse(certificateInfoStr),
                    certificateSignature: caCert?.signature
                }, (await this._authRep.getCAPublicKey()).publicKey)) == false) {
                    process.exit(0);
                }
                console.log("CERTIFICATED");
                this._authRep.saveServerCertificate(certificateInfoStr, caCert?.signature);
                break;
            }
            await (0, shared_functions_1.sleep)(1000);
        }
    }
    initiate() {
        this._httpServer.listen(process.env.PORT, () => { console.log(`Server running on port ${process.env.PORT}`); });
        this._initializeWebsocketInfoManager();
        this._listenToConnections();
        this._API();
    }
    _initializeWebsocketInfoManager() {
        websocket_info_manager_1.WebsocketInfoManager.initialize(this._eventHandler, this._socketsStateHandler);
    }
    _listenToConnections() {
        this._server.on('connection', (client) => this._onConnection(client));
    }
    _onConnection(client) {
        websocket_info_manager_1.WebsocketInfoManager.getInstance().createWebsocketConnection(client, new authenticator_1.Authenticator(new authenticator_repository_1.AuthenticatorRepository(), this._serverKeyPair));
    }
    _API() {
        let account = this._account;
        this._app.get('/try', async (req, res) => {
            return res.send("HELLO WORLD");
        });
        this._app.post('/signUp', async (req, res) => {
            let msg = {
                phoneNumber: req.body.phoneNumber,
                password: req.body.password,
                certificate: req.body.certificate
            };
            return res.json(await account.signUp(msg));
        });
        this._app.post('/signIn', async (req, res) => {
            let msg = {
                phoneNumber: req.body.phoneNumber,
                password: req.body.password
            };
            return res.json(await account.signIn(msg));
        });
    }
}
exports.ServerController = ServerController;

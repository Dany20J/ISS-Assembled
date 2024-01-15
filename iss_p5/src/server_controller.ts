import WebSocket from 'ws';
import http from 'http';
import express from 'express';

import { PrismaClient, ServerKeyPair } from '@prisma/client'


import { EventHandler } from './handler/event_handler';
import { SocketsStateHandler } from './handler/sockets_state_handler';
import { MessageHandler } from './handler/message_handler';

import { Account, SignInMessage, SignUpMessage } from './account/account';
import { AccountRepository } from './account/account_repository';
import { WebsocketInfoManager } from './websocket_manager/websocket_info_manager';
import { Authenticator } from './websocket_manager/authenticator';
import { AccountServicesHandler } from './handler/account_services_handler';
import { MessageDestinationHandler } from './handler/message_destination_handler';
import { AuthenticationHandler } from './handler/authentication_handler';
import { ChatServicesHandler } from './handler/chat_services_handler';
import { Chat } from './chat/chat';
import { ChatRepository } from './chat/chat_repository';
import { AuthenticatorRepository } from './websocket_manager/authenticator_repository';
import fetch from 'node-fetch';
import { sleep } from './shared_functions/shared_functions';
import { Certificate } from './shared_types/certificate';
import keypair from 'keypair';



export class ServerController {


    private _serverKeyPair: ServerKeyPair | undefined

    private _primsa: PrismaClient = new PrismaClient()
    private _httpServer: http.Server;
    private _app: express.Express;
    private _server: WebSocket.Server;


    private _eventHandler: EventHandler

    private _eventToMsg: Map<string, Array<MessageHandler>>
    private _socketsStateHandler: SocketsStateHandler
    private _messageDestinationHandler: MessageDestinationHandler


    private _account: Account
    private _chat: Chat

    private _accountServicesHandler: AccountServicesHandler
    private _authenticationHandler: AuthenticationHandler
    private _chatServicesHandler: ChatServicesHandler


    private _authRep: AuthenticatorRepository
    constructor() {


        
        this._authRep = new AuthenticatorRepository()
        this._authRep.setCAPublicKey('-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA11Tbvr5fALpPrmE3lGRa\ny26+j/WdKOPV28iUQMcnYlkl7t1oHyB5i2ugCoUX6u7W0yLxWv8Pj+mmFuIXbqkz\nT/8CraAhLh7+7a3gvDLu2iJkI04y2Ro94qIeOaK0ybZSUbkWCrbkocQWfZUc5izC\nWuIhdMLN0o64pmQYjywTqkY10hzvQW8MuwBQY83tlqnRuSrUfMARnIk/m8XdLCPx\nCqijo3RK7S3A4d/LPrh7sG+ahfKY5PNKeeVfMs70oW9xXbUXutx/BXG2JEzCZB+2\nFSFYkmj+1fmCXz49nKDNVwu6upK/QZn8t9zjI/2/OkcXpMPtNa8564+qvdp9eLUU\njwIDAQAB\n-----END PUBLIC KEY-----\n')

        this.initializeCertificate()


        this._account = new Account(new AccountRepository(), 5, this._authRep, new Authenticator(this._authRep, this._serverKeyPair!))
        this._chat = new Chat(new ChatRepository())

        this._messageDestinationHandler = new MessageDestinationHandler()




        this._accountServicesHandler = new AccountServicesHandler(this._account, this._messageDestinationHandler)
        this._authenticationHandler = new AuthenticationHandler(this._messageDestinationHandler, this._authRep)
        this._chatServicesHandler = new ChatServicesHandler(this._chat, this._messageDestinationHandler)

        this._eventToMsg = new Map()

        this._eventToMsg.set('signIn', [this._accountServicesHandler])
        this._eventToMsg.set('signUp', [this._accountServicesHandler])


        this._eventToMsg.set('signOut', [this._authenticationHandler])
        this._eventToMsg.set('getCertificate', [this._authenticationHandler])
        this._eventToMsg.set('setSessionKey', [this._authenticationHandler])
        this._eventToMsg.set('getSomeCertificate', [this._authenticationHandler])

        this._eventToMsg.set('chatSubscription', [this._chatServicesHandler])
        this._eventToMsg.set('chatUnSubscription', [this._chatServicesHandler])
        this._eventToMsg.set('getChatsHistory', [this._chatServicesHandler])
        this._eventToMsg.set('getMessagesHistory', [this._chatServicesHandler])
        this._eventToMsg.set('sendMessage', [this._chatServicesHandler])

        this._eventToMsg.set('state', [this._chatServicesHandler])

        this._eventHandler = new EventHandler(this._eventToMsg)

        this._socketsStateHandler = new SocketsStateHandler()
        this._socketsStateHandler.addListener(this._eventHandler)


        this._app = express()
        this._app.use(express.json())
        this._httpServer = http.createServer(this._app)

        this._server = new WebSocket.Server({ server: this._httpServer })


    }

    public async initializeCertificate() {
        this._serverKeyPair = await (this._authRep.getServerPairKey())
        await this.certifyServerPublicKey()
    }
    public async certifyServerPublicKey() {
        if (await this._authRep.getServerCertificate() != null)
            return
        console.log('NO cert')
        let dataToSend = JSON.stringify({
            phoneNumber: '0000000000',
            publicKey: this._serverKeyPair?.serverPublicKey
        })

        let response = await fetch('http://localhost:8999/post-csr', {
            method: 'POST',
            body: dataToSend,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });


        let incomingData = (await response.json()) as { successful: boolean, message?: string, error?: string }


        if (response.ok && incomingData.successful) {
            console.log("Loop")

            this.getCertLoop()
        }

    }
    public async getCertLoop() {
        while (true) {
            let dataToSend = JSON.stringify({
                phoneNumber: '0000000000',
            })

            let response = await fetch('http://localhost:8999/get-cert', {
                method: 'POST',
                body: dataToSend,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            

            let incomingData = (await response.json()) as {
                successful: boolean, error?: string,
                cert?: { signature: string, signatureData: string }
            }

            if (incomingData.successful) {
                let caCert = incomingData.cert
                let certificateInfoStr = (caCert?.signatureData)!

                if ((new Authenticator(this._authRep, this._serverKeyPair!).verifiyCertificate({
                    certificateInfo: JSON.parse(certificateInfoStr),
                    certificateSignature: caCert?.signature!
                }, (await this._authRep.getCAPublicKey())!.publicKey)) == false) {
                    process.exit(0)
                }
                console.log("CERTIFICATED")
                this._authRep.saveServerCertificate(certificateInfoStr, caCert?.signature!)
                break
            }
            await sleep(1000)
        }
    }


    public initiate() {
        this._httpServer.listen(process.env.PORT, () => { console.log(`Server running on port ${process.env.PORT}`) })

        this._initializeWebsocketInfoManager()
        this._listenToConnections()
        this._API()
    }
    private _initializeWebsocketInfoManager() {
        WebsocketInfoManager.initialize(this._eventHandler, this._socketsStateHandler)
    }

    _listenToConnections() {
        this._server.on('connection', (client: WebSocket.WebSocket) => this._onConnection(client))
    }

    private _onConnection(client: WebSocket.WebSocket): void {
        WebsocketInfoManager.getInstance().createWebsocketConnection(client, new Authenticator(new AuthenticatorRepository(), this._serverKeyPair!))
    }

    private _API() {
        let account: Account = this._account
        this._app.get('/try', async (req, res) => {
            return res.send("HELLO WORLD")
        })
        this._app.post('/signUp', async (req, res) => {

            let msg: SignUpMessage = {
                phoneNumber: req.body.phoneNumber,
                password: req.body.password,
                certificate: req.body.certificate
            };
            return res.json(await account.signUp(msg))
        })

        this._app.post('/signIn', async (req, res) => {
            let msg: SignInMessage = {
                phoneNumber: req.body.phoneNumber,
                password: req.body.password
            }
            return res.json(await account.signIn(msg))
        })

    }
}

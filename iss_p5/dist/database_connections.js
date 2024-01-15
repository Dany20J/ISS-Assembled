"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConnection = void 0;
const mysql_1 = __importDefault(require("mysql"));
const util_promisify_1 = __importDefault(require("util.promisify"));
class DatabaseConnection {
    constructor(databaseCI, autoConnect = true) {
        this._isConnected = false;
        this._db = mysql_1.default.createConnection({
            host: databaseCI.host,
            user: databaseCI.user,
            password: databaseCI.password,
            database: databaseCI.database
        });
        if (autoConnect)
            this.connect();
    }
    connect() {
        this._db.connect();
        this._isConnected = true;
        this._dbPromisified = (0, util_promisify_1.default)(this._db.query.bind(this._db));
    }
    queryPromise(query) {
        if (this._dbPromisified != null)
            return this._dbPromisified(query);
        return Promise.resolve(undefined);
    }
}
exports.DatabaseConnection = DatabaseConnection;

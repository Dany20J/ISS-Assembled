import mysql from 'mysql'
import promisfy from 'util.promisify'
export type DatabaseConnectionInfo = {
    host: string, user: string, password: string, database: string
}
export class DatabaseConnection {
    private _db: mysql.Connection
    private _dbPromisified?: (query: string) => Promise<any>
    private _isConnected: boolean = false
    constructor(databaseCI: DatabaseConnectionInfo, autoConnect = true) {

        this._db = mysql.createConnection({
            host: databaseCI.host,
            user: databaseCI.user,
            password: databaseCI.password,
            database: databaseCI.database
        })
        if (autoConnect)
            this.connect()
    }
    public connect(): void {
        this._db.connect()
        this._isConnected = true
        this._dbPromisified = promisfy(this._db.query.bind(this._db))

    }
    public queryPromise(query: string): Promise<any> {
        if (this._dbPromisified != null)
            return this._dbPromisified(query)
        return Promise.resolve(undefined)
    }


}
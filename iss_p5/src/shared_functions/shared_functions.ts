export function _handleError(err: any): undefined {
    console.log(err)
    return undefined
}
export function _handleErrorFalse(err: any): boolean {
    console.log(err)
    return false
}
export function _has(parentProperty: any, childProperty: string): boolean {
    return parentProperty.hasOwnProperty(childProperty)
}

export function _hasList(parentProperty: any, childPropertyList: Array<string>) {
    for (const childProperty of childPropertyList)
        if (!parentProperty.hasOwnProperty(childProperty))
            return false
    return true
}

export function getFirstElementOfSqlData(data: any): any {
    return JSON.parse(JSON.stringify(data[0]))
}
export function getSqlData(data: any): any {
    return JSON.parse(JSON.stringify(data))

}

export function numberListToSqlList(primitiveList: Array<number>): string {
    if (primitiveList.length == 0)
        primitiveList.push(-11111111)

    let sqlList = ''
    for (let i = 0; i < primitiveList.length; i++) {
        if (i == primitiveList.length - 1)
            sqlList += primitiveList[i].toString()
        else sqlList += primitiveList[i].toString() + ', '
    }
    return `(${sqlList})`
}

export function stringListToSqlList(primitiveList: Array<string>): string {
    if (primitiveList.length == 0)
        primitiveList.push('_NULL000111000')

    let sqlList = ''
    for (let i = 0; i < primitiveList.length; i++) {
        primitiveList[i] = '\'' + primitiveList[i] + '\''
        if (i == primitiveList.length - 1)
            sqlList += primitiveList[i].toString()
        else sqlList += primitiveList[i].toString() + ', '
    }
    return `(${sqlList})`
}

export function decodeHex(hex: string): string {
    return decodeURIComponent(hex.replace(/\s+/g, '').replace(/[0-9a-f]{2}/g, '%$&'))
}


export function generateRandomBuffer(): Buffer {
    let max = 255, min = 0
    let lis = []
    for (let i = 0; i < 32; i++) {
        lis.push(Math.random() * (max - min) + min)
    }
    return Buffer.from(lis)
}

export function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
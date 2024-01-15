"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.generateRandomBuffer = exports.decodeHex = exports.stringListToSqlList = exports.numberListToSqlList = exports.getSqlData = exports.getFirstElementOfSqlData = exports._hasList = exports._has = exports._handleErrorFalse = exports._handleError = void 0;
function _handleError(err) {
    console.log(err);
    return undefined;
}
exports._handleError = _handleError;
function _handleErrorFalse(err) {
    console.log(err);
    return false;
}
exports._handleErrorFalse = _handleErrorFalse;
function _has(parentProperty, childProperty) {
    return parentProperty.hasOwnProperty(childProperty);
}
exports._has = _has;
function _hasList(parentProperty, childPropertyList) {
    for (const childProperty of childPropertyList)
        if (!parentProperty.hasOwnProperty(childProperty))
            return false;
    return true;
}
exports._hasList = _hasList;
function getFirstElementOfSqlData(data) {
    return JSON.parse(JSON.stringify(data[0]));
}
exports.getFirstElementOfSqlData = getFirstElementOfSqlData;
function getSqlData(data) {
    return JSON.parse(JSON.stringify(data));
}
exports.getSqlData = getSqlData;
function numberListToSqlList(primitiveList) {
    if (primitiveList.length == 0)
        primitiveList.push(-11111111);
    let sqlList = '';
    for (let i = 0; i < primitiveList.length; i++) {
        if (i == primitiveList.length - 1)
            sqlList += primitiveList[i].toString();
        else
            sqlList += primitiveList[i].toString() + ', ';
    }
    return `(${sqlList})`;
}
exports.numberListToSqlList = numberListToSqlList;
function stringListToSqlList(primitiveList) {
    if (primitiveList.length == 0)
        primitiveList.push('_NULL000111000');
    let sqlList = '';
    for (let i = 0; i < primitiveList.length; i++) {
        primitiveList[i] = '\'' + primitiveList[i] + '\'';
        if (i == primitiveList.length - 1)
            sqlList += primitiveList[i].toString();
        else
            sqlList += primitiveList[i].toString() + ', ';
    }
    return `(${sqlList})`;
}
exports.stringListToSqlList = stringListToSqlList;
function decodeHex(hex) {
    return decodeURIComponent(hex.replace(/\s+/g, '').replace(/[0-9a-f]{2}/g, '%$&'));
}
exports.decodeHex = decodeHex;
function generateRandomBuffer() {
    let max = 255, min = 0;
    let lis = [];
    for (let i = 0; i < 32; i++) {
        lis.push(Math.random() * (max - min) + min);
    }
    return Buffer.from(lis);
}
exports.generateRandomBuffer = generateRandomBuffer;
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
exports.sleep = sleep;

// Copyright (c) 2017 LiquidOxygen
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// File description: Account management of KentChat Server
/// <reference path="fs.ts" />
/// <reference path="encrypt.ts" />
/// <reference path="logging.ts" />

import { Logger } from './logging';
import { Crypt } from './encrypt';
import * as Crypto from 'crypto';
import { BasicFile, getKentChatPath } from './fs';

/**
 * Describes the type of the values in accountDb.
 */
type SerializedAccount = {
    username: string,
    password: string,
    options: OptionKvPair
};

/*
 * accounts.json format:
 * {
 *   "ejRNqiwejREjrmaepqJelaA": {
 *     "username": "broadwell",
 *     "password": "1ClejEnrmqR21kj5nrM4ffIWjap==", // hashed twice
 *     "options": {
 *       "dm.formatText": true
 *     }
 *   }
 * }
 */
const accountDb = new BasicFile<{[uid: string]: SerializedAccount}>(getKentChatPath('accounts.json'));

// === OPTIONS ===

/**
 * Amount of bytes for each account Unique ID.
 */
const accountUidSize = 3;

/**
 * The encoding of an account unique ID.
 */
const accountUidEncoding = 'base64';

/**
 * The default object to fill a user's "options" value with when creating it.
 */
const accountDefaultOptions: OptionKvPair = {
    'dm.formatMarkdown': true
};

/**
 * Array of forbidden characters in an account's username.
 */
const forbiddenNameChars = Array.from(" %^@#\\");

/**
 * Key-value pair type for account options.
 */
type OptionKvPair = {[key: string]: string|number|boolean};

/**
 * Tests if the given username is a valid account username, using the `forbiddenNameChars` constant.
 * 
 * @export
 * @param {string} username Username string to check
 * @returns {string} Forbidden character if username invalid; Otherwise `null`
 */
export function usernameValid(username: string): string {
    for (let forbiddenChar of forbiddenNameChars) {
        if (username.includes(forbiddenChar)) {
            return forbiddenChar;
        }
    }
    return null;
}

/**
 * Generates a new Unique ID that is not occupied by any other account.
 * 
 * @export
 * @returns {string}
 */
export function newUid(): string {
    let first = true;
    let uid: string;
    while (first || uid in accountDb.map) {
        uid = Crypto.randomBytes(accountUidSize).toString(accountUidEncoding);
        first = false;
    }
    return uid;
}

/**
 * Retrieves the account whose username is equal to the username provided, then returns the unique ID for that account.
 * 
 * Has `O(n)` complexity.
 * 
 * @export
 * @param {string} username Username to query for UID
 * @returns {string} UID of account, or `null` if the account does not exist
 */
export function getUidByUsername(username: string): string {
    for (let uid in accountDb.map) {
        if (accountDb.map[uid].username === username) {
            return uid;
        }
    }
    return null;
}

export class Account {

    /**
     * Registers a new account and stores it in the server's database.
     * 
     * @public
     * @static
     * @param {string} name Username of the new account
     * @param {Buffer} passwd Password of the new account, SHA256'd once
     * @returns {string} Unique ID of the new account if it's created; Errors will be thrown otherwise
     * 
     * @memberOf Account
     */
    public static register(name: string, passwd: Buffer): string {
        Logger.into('Account::register');

        for (let account in accountDb.map) {
            if (accountDb.map[account].username === name) {
                throw Error(`Account with name ${name} already exists`);
            }
        }
        
        {
            const badChar = usernameValid(name);
            if (badChar !== null) {
                throw Error(`Forbidden character in name ${JSON.stringify(name)}: ${JSON.stringify(badChar)}`);
            }
        }

        const uid = newUid();
        const maskpwd = Crypt.sha256Hash(passwd); // Hash it twice in total

        accountDb.map[uid] = {
            'username': name,
            'password': maskpwd.toString('hex'),
            'options': accountDefaultOptions,
        };

        accountDb.write();
        Logger.log('info', `New account has been created: ${name}`);

        Logger.outOf();
        return uid;
    }

    // -----
    username: string;
    uid: string;
    online: boolean;
    preferences: OptionKvPair;

    /**
     * Creates a new instance of an existing Account. Construct before manipulating account data, and destruct when done.
     * @param {string} username Username of the account
     * 
     * @memberOf Account
     */
    constructor(username: string) {
        this.username = username;

        const uid = getUidByUsername(username);
        if (uid === null) {
            throw Error(`Username ${username} does not exist in database`);
        }
        this.uid = uid;
        this.online = false;
        this.preferences = accountDb.map[uid].options;
    }

    /**
     * When the user of this account logs in/out, update the status as necessary.
     * 
     * @param {boolean} newStatus The new online status; `true` for online, `false` for offline.
     * 
     * @memberOf Account
     */
    public setOnline(newStatus: boolean) {
        this.online = newStatus;
    }

    /**
     * Checks the given password _(which was hashed with SHA256 once)_ and returns whether or not such password is correct for this account.
     * 
     * @param {Buffer} password Password, hashed once, usually fresh from `WebSocket`
     * @returns {boolean} Whether or not the password was correct
     * 
     * @memberOf Account
     */
    public checkPassword(password: Buffer): boolean {
        return Crypt.sha256Hash(password).equals(Buffer.from(accountDb.map[this.uid].password, 'base64'));
    }

}
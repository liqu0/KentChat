// Copyright (c) 2017 LiquidOxygen
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// File description: Filesystem utilities
// This file is used by account.ts and message.ts.

/// <reference path="typings/index.d.ts" />
/// <reference path="encrypt.ts" />
import { Crypt } from './encrypt';
import * as fs from 'fs';
import { Logger } from './logging';
import * as path from 'path';

export class BasicFile {
    uri: string;
    map: Object;

    constructor(location: string) {
        if (!fs.existsSync(location)) {
            fs.writeFileSync(location, '{}');
        }
    }

    write() {
        fs.writeFileSync(this.uri, JSON.stringify(this.map));
    }

    read(): Object {
        Logger.into(`[${this}].read`);
        try {
            this.map = JSON.parse(fs.readFileSync(this.uri, 'utf8'));
        } catch (e) {
            Logger.fail(e, 'Corrupt JSON in LocalFile');
        } finally {
            Logger.outOf();
        }
        return this.map;
    }

    toString() {
        return `LocalFile<uri=${JSON.stringify(this.uri)}>`;
    }
}

export class VirtualDirectory extends BasicFile {
    separator: string;
    
    constructor(loc: string, sep: string = '.') {
        super(loc);
        this.separator = sep;
    }

    lookup(key: string): string {
        Logger.into('VirtualDirectory.lookup');
        if (key.length === 0) {
            Logger.log('warn', 'Key for lookup is empty');
        } else if (!(key in this.map)) {
            Logger.log('warn', `Key during lookup (${JSON.stringify(key)}) does not exist`);
        } else {
            Logger.outOf();
            return this.map[key];
        }
        Logger.outOf();
        return null;
    }

    put(key: string, val: string, write: boolean = true): void {
        Logger.into('VirtualDirectory.put');
        if (key.length === 0) {
            Logger.log('warn', 'Key for new value is empty');
        } else {
            this.map[key] = val;
            if (write) {
                this.write();
            }
        }
        Logger.outOf();
    }
}

const KentChatHome = '/projects/kentchat/';
export function getKentChatPath(subpath: string): string {
    return path.join(KentChatHome, subpath);
}
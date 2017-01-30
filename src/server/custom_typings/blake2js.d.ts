// Copyright (c) 2017 LiquidOxygen
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// File description: Type declaration of the [blake2js](https://www.npmjs.com/package/blake2js) NPM package

declare module 'blake2js' {
    export type Blake2Algorithm = 'blake2s'|'blake2sp'|'blake2b'|'blake2bp';

    export function hash(algorithm: Blake2Algorithm,
                         data: Object|Buffer|string,
                         option?: Object,
                         encoding?: string): Buffer|string;
}
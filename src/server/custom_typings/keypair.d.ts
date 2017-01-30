// Copyright (c) 2017 LiquidOxygen
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// File description: Type definition for keypair NPM package

declare module 'keypair' {
    interface IKeyPair {
        /**
         * Returns an object consisting of armored RSA keys.
         * 
         * @param {Object} [opts] Options, can be `bits` (size for private key in bits, default 2048), and/or `e` (public exponent to use, default 65537)
         * @memberOf IKeyPair
         */
        (opts?: Object): {'public':string, 'private':string};
    }
    var kpInstance: IKeyPair;
    export = kpInstance;
}
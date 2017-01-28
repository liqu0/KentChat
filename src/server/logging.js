//    Copyright 2017 LiquidOxygen
// 
//    Licensed under the Apache License, Version 2.0 (the "License");
//    you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
// 
//        http://www.apache.org/licenses/LICENSE-2.0
// 
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.
// This file is part of KentChat
// File description: Logging support for KentChat server
/// <reference path="typings/index.d.ts" />
import * as Colors from 'colors';
import * as formatTime from 'strftime';
/**
 * Logger
 *
 * A static logger implementation
 */
export var Logger;
(function (Logger) {
    /**
     * Format of the logger's output. The following lists the interpolations available here:
     * - {level}: The level of logging requested by the logging source. Values are declared in `levels`.
     * - {enclosures}: Whenever execution enters a certain function that uses this logger, they should add their name to the list of enclosures using `into`. This interpolation is replaced with all elements in the enclosures list, joined by ': '.
     * - {date}: The date (and possibly time) when this log message is printed. This interpolation is replaced with the result of `strftime` with `timeFormat` set as the desired format for the interpolated value.
     * - {message}: The message that the logging source intends to print.
     */
    let format = '[ {date} @ {level} ] {enclosures}: {message}';
    /**
     * Format for `strftime` to use while generating interpolation replacement for `format`.
     */
    let timeFormat = '%m-%d %H:%M:%S';
    /**
     * List of enclosures that KentChat server is currently in
     */
    let enclosureList = [];
    /**
     * Describes the levels of this logger. Example:
     * `{
     *    "info": {display: "ℹ️️", colors: [Colors.white]},
     *    "warn": {display: "⚠️️", colors: [Colors.yellow]},
     *    "error": {display: "❌", colors: [Colors.red]},
     *    "fatal": {display: "⛔", colors: [Colors.white, Colors.bgRed]}
     * }`
     */
    let levels = {
        'info': { color: Colors.reset },
        'warn': { color: Colors.yellow },
        'error': { color: Colors.red },
        'fatal': { color: Colors.black.bgRed },
    };
    /**
     * Provides the loglevel display packs; Most are emoji-based.
     */
    let levelDisplays = {
        'normal': {
            'info': 'ℹ️️',
            'warn': '⚠️️',
            'error': '❌',
            'fatal': '⛔',
        },
        'hand': {
            'info': '👌',
            'warn': '👉',
            'error': '👎',
            'fatal': '🖕',
        },
        'face': {
            'info': '🙂',
            'warn': '😲',
            'error': '😡',
            'fatal': '😵',
        },
        'weather': {
            'info': '☀️',
            'warn': '🌧',
            'error': '🌩',
            'fatal': '⚡️',
        },
        'random': {
            'info': '✔',
            'warn': '❗️',
            'error': '💔',
            'fatal': '☠️',
        },
        'text': {
            'info': 'INFO',
            'warn': 'WARN',
            'error': 'ERROR',
            'fatal': '!FATAL!',
        }
    };
    /**
     * Interpolates the given string using the object provided.
     *
     * Example: `interpolate("Hello, {name}!", {name: "Marcus"})` returns `"Hello, Marcus!"`
     */
    function interpolate(src, vals) {
        let output = src;
        for (let label in vals) {
            output = output.replace(`{${label}}`, vals[label]);
        }
        return output;
    }
    /**
     * The main log function. May take an optional argument specifying which displayStyle to use.
     *
     * All other components of KentChat server should use this function for logging.
     */
    function log(level, message, displayStyle = 'normal') {
        // We strive to keep this part dynamic, otherwise we'll need to edit both `levels` and the overloading of `log(..)` in order to add new levels.
        if (!(level in levels)) {
            throw new Error(`Logger.log has encountered an unknown level: ${level}`);
        }
        console.log(levels[level].color(interpolate(format, {
            'level': levelDisplays[displayStyle][level],
            'enclosures': enclosureList.join(': '),
            'date': formatTime(timeFormat),
            'message': message,
        })));
    }
    Logger.log = log;
    /**
     * Logs the stack trace of the provided error. Optional information can be provided to prepend the stack trace.
     *
     * Meant to be called from an error handler
     */
    function fail(err, info) {
        log('error', 'An error occurred in KentChat server' + (info ? `: ${info}` : ''));
        into('Logger.fail');
        for (let line of err.stack.split('\n')) {
            log('error', line);
        }
        outOf();
    }
    Logger.fail = fail;
    /**
     * Appends an entry to enclosureList.
     *
     * Should be called at the beginning of every KentChat server function that uses this logger.
     */
    function into(newEnclosure) {
        if (enclosureList.includes(newEnclosure)) {
            log('warn', `Logger.into has detected that newEnclosure (${newEnclosure}) already exists in \`enclosureList\``);
            return false;
        }
        if (newEnclosure.trim().length === 0) {
            log('warn', `Logger.into has detected that newEnclosure (${newEnclosure}) is empty after trimmed`);
            return false;
        }
        enclosureList.push(newEnclosure);
        return true;
    }
    Logger.into = into;
    /**
     * Removes an entry from enclosureList. Should be called on every function that calls `into`.
     */
    function outOf() {
        if (enclosureList.length === 0) {
            into('Logger.outOf');
            log('warn', 'Called when enclosureList is empty');
            outOf();
            return;
        }
        return enclosureList.pop();
    }
    Logger.outOf = outOf;
})(Logger || (Logger = {}));

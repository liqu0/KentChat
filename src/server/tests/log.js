// Copyright (C) 2017  LiquidOxygen
// 
// This file is part of KentChat.
// 
// KentChat is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// KentChat is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with KentChat.  If not, see <http://www.gnu.org/licenses/>.
// 
"use strict";
// File description: Tester for logging.ts
// NOTE: This file cannot test automatically; Examine STDOUT for results.
/// <reference path="../logging.ts" />
var logging_1 = require("../logging");
logging_1.Logger.into('test-phase1');
logging_1.Logger.log('info', 'Information0');
logging_1.Logger.log('info', String(42));
logging_1.Logger.log('info', '');
logging_1.Logger.log('info', 'InformationEnd');
logging_1.Logger.outOf();
logging_1.Logger.into('test-phase2');
logging_1.Logger.log('info', 'Information1', 'hand');
logging_1.Logger.log('warn', 'Warning0', 'hand');
logging_1.Logger.log('error', 'Error0', 'hand');
logging_1.Logger.log('fatal', 'Fatal0', 'hand');
logging_1.Logger.outOf();
logging_1.Logger.log('warn', 'Expect outOf underflow next', 'face');
logging_1.Logger.outOf();
try {
    throw new RangeError('Golf range too small');
}
catch (error) {
    logging_1.Logger.fail(error);
    logging_1.Logger.log('info', '--split--');
    logging_1.Logger.fail(error, 'Pre-description blah');
}

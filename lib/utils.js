/*
  Copyright Jesús Pérez <jesusprubio@fsf.org>

  This code may only be used under the MIT license found at
  https://opensource.org/licenses/MIT.
*/

'use strict';

const path = require('path');

// Lodash as base.
const utils = require('lodash');
const debug = require('debug');

const { name } = require('../package.json');


// To follow the convention: https://github.com/visionmedia/debug#conventions
utils.dbg = (tag) => debug(`${name}:${tag}`);


module.exports = utils;

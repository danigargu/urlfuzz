'use strict';

const fs = require('fs');
const path = require('path');

const bruteforce = require('./lib/bruteforce');
const utils = require('./lib/utils');
const { version } = require('./package');


// We do it sync because we need it before any run.
const listNames = fs.readdirSync(path.resolve(__dirname, 'artifacts', 'lists'));
const lists = utils.map(listNames, listName => path.basename(listName, '.txt'));


module.exports = {
  bruteforce,
  version,
  lists
};

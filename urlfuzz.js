#!/usr/bin/env node
//
// URLfuzz - by danigargu
//

"use strict";

var fs           = require('fs')
var path         = require('path')
var http         = require('http')
var es           = require('event-stream')
var stream       = require('stream')
var util         = require('util')
var colors       = require('colors')
var async        = require('async')
var sprintf      = require("sprintf-js").sprintf
var request      = require('request')
var Getopt       = require('node-getopt')
var Promise      = require('bluebird')
var Agent        = require('socks5-http-client/lib/Agent')
var lineByLine   = require('n-readlines')
var csv          = require('ya-csv')
var brute        = require('./lib/bruteforce')


const LOGO = '\n\
  ██╗   ██╗██████╗ ██╗     ███████╗██╗   ██╗███████╗███████╗ \n\
  ██║   ██║██╔══██╗██║     ██╔════╝██║   ██║╚══███╔╝╚══███╔╝ \n\
  ██║   ██║██████╔╝██║     █████╗  ██║   ██║  ███╔╝   ███╔╝  \n\
  ██║   ██║██╔══██╗██║     ██╔══╝  ██║   ██║ ███╔╝   ███╔╝   \n\
  ╚██████╔╝██║  ██║███████╗██║     ╚██████╔╝███████╗███████╗ \n\
   ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝      ╚═════╝ ╚══════╝╚══════╝ \n';

const FUZZ_TAG   = '#FUZZ#';
const LOG_HEADER = "= CODE ======== LINES ======== WORDS == VALUE " + Array(37).join("=");
const LOG_FORMAT = "   %1$s          %2$5d          %3$5d    %4$s";
const CSV_HEADER = ['code', 'value', 'lines', 'words']

var config;

const error_codes = {
  200: {'color': colors.green.bold,  'text': 'OK'},
  204: {'color': colors.grey.bold,   'text': 'Empty'},
  301: {'color': colors.cyan.bold,   'text': 'Moved'},
  401: {'color': colors.yellow.bold, 'text': 'Unauth.'},
  404: {'color': colors.red.bold,    'text': 'NotFound'},
  500: {'color': colors.blue.bold,   'text': 'SrvError'}
};

function parse_args() {
  var config = {
    'fuzz_key': null,
    'fuzz_type': null,
    'debug': false,
    'url': null,
    'max_sockets': 150,
    'wordlist': null,
    'head': false,
    'hc': [],
    'hw': [],
    'hl': [],
    'ht': null,
    'st': null,
    'post_data': null,
    'bruteforce': null,
    'range': null,
    'headers': null,
    'download': null,
    'proxy': null,
    'socks': null,
    'timeout': null,
    'http_opts': null,
    'replacer': null,
    'results': null,
    'res_writer': null,
    'cb_on_match': []
  };

  var getopt = new Getopt([
    ['H' , 'headers=ARG+'     , 'set headers' ],
    ['h' , 'head'             , 'use HEAD instead of GET' ],
    ['d' , 'data=ARG'         , 'POST data (format: foo1=bar1&foo2=bar2)' ],
    ['w' , 'wordlist=ARG'     , 'use a wordlist'],
    ['b' , 'bruteforce=ARG'   , 'perform bruteforce (format -> min:max:charset)'],
    ['r' , 'range=ARG'        , 'fuzz with range (format -> start:end[:step])'],
    ['o' , 'download=ARG'     , 'download results that matches (output dir)'],
    ['x' , 'results=ARG'      , 'exports results to file (format: csv)'],
    ['p' , 'proxy=ARG'        , 'use proxy (http://host:port)'],
    ['s' , 'socks=ARG'        , 'use socks (host:port)'],
    [''  , 'hc=ARG'           , 'filter by error codes (comma separated)'],
    [''  , 'hw=ARG'           , 'filter by words (comma separated)'],
    [''  , 'hl=ARG'           , 'filter by lines (comma separated)'],
    [''  , 'ht=ARG'           , 'hide responses that matches str'],
    [''  , 'st=ARG'           , 'show responses that matches str'],
    [''  , 'max-sockets=ARG'  , 'max sockets (default: ' + config.max_sockets + ')'],
    [''  , 'timeout=ARG'      , 'timeout (default: X ms)'],
    [''  , 'debug'            , 'debug mode'],
    ['h' , 'help'             , 'display this help']
  ]);

  getopt.setHelp(
    "Usage: node urlfuzz.js <URL> [OPTIONS]\n" +
    "\n" +
    "[[OPTIONS]]\n\n" +
    "Fuzzezable items: [url, headers, post_data]\n" +
    "Fuzz tag: " + FUZZ_TAG
  );

  var args = getopt.parse(process.argv.slice(2));
  config.url = args.argv[0];

  if (args.options.help || !args.argv.length) {
    getopt.showHelp();
    return null;
  }

  for (var item in args.options) {
    switch (item) {
      case 'hc':
      case 'hw':
      case 'hl':
        config[item] = args.options[item].split(',').map(Number);
        break;

      case 'data':
        config.post_data = args.options[item];
        break;

      case 'wordlist':
        var wordlist = args.options[item];
        if (!fs.existsSync(wordlist))
          throw 'The input wordlist does not exist';

        config[item] = wordlist;
        config.fuzz_type = 'Wordlist'
        break;

      case 'timeout':
      case 'max-sockets':
        config.max_sockets = parseInt(args.options[item]);
        break;

      case 'debug':
      case 'head':
        config[item] = true;
        break;

      case 'bruteforce':
        var brute_opts = args.options[item].split(":");
        if (brute_opts.length != 3)
          throw "Invalid arguments for bruteforce option"

        config[item] = {
          'min': parseInt(brute_opts[0]),
          'max': parseInt(brute_opts[1]),
          'charset': brute_opts[2]
        }
        config.fuzz_type = 'Bruteforce'
        break;

      case 'range':
        var range_opts = args.options[item].split(":");
        var start, end, step;

        if (range_opts.length != 2 && range_opts.length != 3)
          throw "Invalid arguments for range option"
        
        start = parseInt(range_opts[0])
        end   = parseInt(range_opts[1])
        step  = range_opts.length == 3 ? parseInt(range_opts[2]) : 1

        if (start >= end)
          throw "Invalid arguments for range: start must be smaller than end"

        config[item] = {
          'start': start,
          'end':   end,
          'step':  step
        }
        config.fuzz_type = 'Range'
        break;

      case 'headers':
        config[item] = args.options[item].join('\n');
        break;

      case 'download':
        var output_dir = args.options[item];
        if (!fs.existsSync(output_dir))
          throw 'The output folder does not exist';

        config[item] = output_dir;
        config.cb_on_match.push(download_result);
        break;
      
      case 'proxy':
      case 'results':
      case 'ht':
      case 'st':
        config[item] = args.options[item];
        break;

      case 'socks':
        var values = args.options[item].replace(/\s/g, '').split(":");
        if (values.length != 2)
          throw "Invalid arguments for socks"

        config[item] = {
          host: values[0],
          port: parseInt(values[1])
        };
        break;
    }
  }

  find_fuzztag(config);

  if (!config.wordlist && !config.bruteforce && !config.range)
    throw "Please, specify a fuzz type (wordlist or bruteforce)."

  return config;
}

function replace_url(opts, value) {
  opts.url = config.url.replace(FUZZ_TAG, value);
}

function replace_data(opts, value) {
  opts.form = config.post_data.replace(FUZZ_TAG, value);
}

function replace_headers(opts, value) {
  var tmp_headers = replace_all(config.headers, FUZZ_TAG, value);
  opts.headers = parse_headers(tmp_headers);
}

function find_fuzztag(config) {
  var found = 0;
  var fuzz_replacers = {
    url       : replace_url,
    headers   : replace_headers,
    post_data : replace_data,
  };

  Object.keys(fuzz_replacers).forEach(function(key) {
    if (config[key] && config[key].indexOf(FUZZ_TAG) != -1) {
      config.replacer = fuzz_replacers[key];
      config.fuzz_key = key;      
      found++;
    }
  });

  if (!found)
    throw 'FUZZ_TAG not found';
  if (found > 1)
    throw 'FUZZ_TAG is only allowed in one item :(';
}

function get_colored_code(error_code) {
  if (error_code in error_codes)
    return error_codes[error_code].color(error_code);
  return colors.yellow(error_code);
}

function read_lines(filename, cb) {
  fs.createReadStream(filename).on('error', function() {
      throw 'Error reading file';
    })
    .pipe(es.split())
    .pipe(es.map(function(line) {
      cb(line)
    }));
}

function fuzz_iter(cb, end_cb) {
  if (config.bruteforce) 
    brute.bruteforce(config.bruteforce, cb);
  else if (config.wordlist)
    read_wordlist_sync(config.wordlist, cb, end_cb);
  else if (config.range)
    range(config.range, cb);
  else
    throw 'Invalid fuzz iterator';
}

// ********* ON MATCH - CALLBACKS  *********   
function save_csv_result(r) {
  var res_values = [r.status_code, r.value, r.n_lines, r.n_words]
  config.res_writer.writeRecord(res_values)
}

function download_result(r) {
  var file_path = path.normalize(config.download + path.sep + r.value)
  fs.writeFile(file_path, r.body, function(err) {
    if (err && err.code != 'EISDIR') throw err
  })
}
// ****************************************

function process_response(args) {
  var value = args[0];
  var res   = args[1];

  if (config.hc.indexOf(res.statusCode) == -1) {
    var n_words = res.body.split(' ').length;
    var n_lines = res.body.split("\n").length;

    if (config.hl.indexOf(n_lines) == -1 && 
        config.hw.indexOf(n_words)) {
    
      if (config.ht && res.body.match(config.ht))
        return

      if (config.st && !res.body.match(config.st))
        return

      var result = {
        n_words: n_words,
        n_lines: n_lines,
        value: value,
        status_code: res.statusCode,
        body: res.body
      }

      console.log(sprintf(LOG_FORMAT, get_colored_code(res.statusCode), 
                          n_lines, n_words, value))

      config.cb_on_match.forEach(function(cb) {
        cb(result)
      })
    }
  }
}

function start_fuzzing() {
  var method = '';
  var s_filtered = '';  

  if (config.debug)
    console.log(config);

  // Request method
  if (config.post_data) {
    method = 'POST';
  } else if (config.head) {
    method = 'HEAD';
  } else {
    method = 'GET';
  }

  // HTTP options
  config.http_opts = {
    method: method,
    url: config.url,
    followRedirect: false,
    form: null,
    strictSSL: false,
    proxy: config.proxy,
    timeout: config.timeout,
    headers: parse_headers(config.headers),
    pool: {
      maxSockets: config.max_sockets
    }
  };

  // SOCKS
  if (config.socks) {
    config.http_opts.agentClass = Agent;
    config.http_opts.agentOptions = {
      socksHost: config.socks.host,
      socksPort: config.socks.port
    };
  }

  console.log(colors.cyan(Array(83).join("=")) + "\n");
  console.log(" Fuzz URL    : " + config.url);

  if (config.post_data)
    console.log(" POST data   : " + config.post_data);

  if (config.hc.length) s_filtered += " C=" + config.hc;
  if (config.hw.length) s_filtered += " W=" + config.hw;
  if (config.hl.length) s_filtered += " L=" + config.hw;

  if (s_filtered && s_filtered.length > 0)
    console.log(' Filtered    :' + s_filtered);

  console.log(' Fuzz type   : ' + config.fuzz_type);

  if (config.headers) {
    console.log(' Headers')
    var headers = parse_headers(config.headers)
    for (var key in headers) {
      console.log('             *  ' + key + ': ' + headers[key])
    }
    console.log('\n')
  }

  var codes = '';
  for (var code in error_codes) {
    codes += get_colored_code(code) + " " + error_codes[code].text + " "
  }

  if (config.results) {
    var stream = fs.createWriteStream(config.results + ".csv")
    config.res_writer = csv.createCsvStreamWriter(stream, {separator: ';'})
    config.res_writer.writeRecord(CSV_HEADER)
    config.cb_on_match.push(save_csv_result)
  }

  get_server_header().then(function (value) {
    console.log(' Server      : ' + (value ? value : '**UNKNOWN**'))
    console.log(' Resp. codes : ' + codes)
    console.log(colors.cyan("\n" + LOG_HEADER))
  })
  .then(function () {
    fuzz_iter(function (value) {
      fuzz_url(value)
        .then(process_response)
        .catch(function (err) {
          console.log(err.message + ' AT ' + value)
        })
    })
  })
}

function fuzz_url(value) {
  return new Promise(function(resolve, reject) {
    var opts = config.http_opts
    config.replacer(opts, value)

    request(opts, function(error, res, body) {
      if (!error)
        resolve([value, res])
      else
        reject(error)
    });
  });
}

function get_server_header() {
  return new Promise(function(resolve, reject) {
    var opts = config.http_opts
    request(opts, function(error, res) {
      if (!error) {
        resolve(res.headers.server);
      }
      else
        reject(error)
    });
  })
}

function read_wordlist_async(filename, cb) {
  fs.createReadStream(config.wordlist).on('error', function() {
    cb(new Error('Error reading file'), null);
  }).pipe(es.split())
    .pipe(es.map(function(line) {
      cb(null, line)
  }));
}

function read_wordlist_sync(filename, cb, end_cb) {
  var line;
  var lineNumber = 0;
  var liner = new lineByLine(config.wordlist);
  while (line = liner.next()) {
    cb(line.toString('ascii'))
  }
  if (end_cb) 
    end_cb()
}

function range(opts, cb) {
  for (var i=opts.start; i<=opts.end; i+=opts.step)
    cb(i);
}

function replace_all(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}

function parse_postdata(data) {
  if (!data) return null; 

  var res = {}
  var vars = data.split("&");
  var len = vars.length;

  if (!len) return null;

  for (var i=0; i<len; i++) {
    var key_value = vars[i].split("=");
    res[key_value[0]] = key_value.slice(1).join("=");
  }
  return res;
}

function parse_headers(headers) {
  var parsed = {}

  if (!headers) return null;
  headers = headers.split("\n");

  for (var i=0; i<headers.length; i++) {
    var header = headers[i].split(":");
    if (header.length < 2)
      throw "Invalid header: " + headers[i]

    var k = header[0].trim(),
        v = header.slice(1).join(":").trim();
    parsed[k] = v;
  }
  return parsed;
}

try {
  console.log(LOGO.green)
  if (config = parse_args()) {
    start_fuzzing()
  }
} catch(e) {
  console.log("[!] ERROR: ".yellow + e);
  if (e.stack) 
    console.log(e.stack);
}


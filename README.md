# URLFUZZ

### DESCRIPTION
Yep, this is another web fuzzer, but using the power of async/non-blocking I/O functions provided by NodeJS allowing you to perform VERY FAST web requests.

#### Fuzzeable items

* URL
* POST data
* HTTP headers

#### Filters

You may filter the responses by:

* Error codes
* Nº Words
* Nº Lines
* Text

#### Payloads

* Wordlist
* Bruteforce
* Range

## INSTALL

Simply, install the dependences with:

 `$ npm install`

## USAGE

To get a list of all options and switches use:

```
Usage: node urlfuzz.js <URL> [OPTIONS]

  -H, --headers=ARG+     set headers
  -h, --head             use HEAD instead of GET
  -d, --data=ARG         POST data (format: foo1=bar1&foo2=bar2)
  -w, --wordlist=ARG     use a wordlist
  -b, --bruteforce=ARG   perform bruteforce (format -> min:max:charset)
  -r, --range=ARG        fuzz with range (format -> start:end[:step])
  -o, --download=ARG     download results that matches (output dir)
  -x, --results=ARG      exports results to file (format: csv)
  -p, --proxy=ARG        use proxy (http://host:port)
  -s, --socks=ARG        use socks (host:port)
      --hc=ARG           filter by error codes (comma separated)
      --hw=ARG           filter by words (comma separated)
      --hl=ARG           filter by lines (comma separated)
      --ht=ARG           hide responses that matches str
      --st=ARG           show responses that matches str
      --max-sockets=ARG  max sockets (default: 150)
      --timeout=ARG      timeout (default: X ms)
      --debug            debug mode
  -h, --help             display this help

Fuzzezable items: [url, headers, post_data]
Fuzz tag: #FUZZ#
```

## EXAMPLES

Fuzz using a wordlist:

`$ node urlfuzz.js http://localhost/#FUZZ# -w big.txt`

Fuzz POST data using wordlist and filter by text:

`$ node urlfuzz.js http://localhost/login.php -d "user=admin&pass=#FUZZ#" -w big.txt --ht denied`

Fuzz 'User-agent' header and filter by lines:

`$ node urlfuzz.js http://localhost/exploit_kit.php -H "User-agent: #FUZZ#" -w user_agents.txt --hl 4`

Download matching files with error code 200:

`$ node urlfuzz.js http://localhost/file-#FUZZ#.exe -b 1:3:0123456789 --hc 200 -d samples/`

Fuzz a user-id with range option:

`$ node urlfuzz.js http://localhost/user.php?id=#FUZZ# -r 1:1000 --hc 200 --st Admin`

Export results to a CSV file:

`$ node urlfuzz.js http://localhost/#FUZZ# -w big.txt -x log`

## THANKS

Thanks to [mandingo](https://twitter.com/m_ndingo) & [cgvwzq](https://twitter.com/cgvwzq) for the ideas during the development of the tool.

## AUTHOR

Daniel García <@danigargu>

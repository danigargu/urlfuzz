# URLFUZZ

[![License](https://img.shields.io/aur/license/yaourt.svg)](https://www.gnu.org/licenses/gpl-3.0.en.html)

:bomb: Yep, this is another web fuzzer, but using the power of async/non-blocking I/O functions provided by NodeJS allowing you to perform VERY FAST web requests.

## FEATURES

### Fuzzeable items

* URL
* POST data
* HTTP headers

### Filters

You may filter the responses by:

* Error codes
* Nº Words
* Nº Lines
* Text

### Payloads

* Wordlist
* Bruteforce
* Range

## INSTALL

:coffee: Simply install the last node [Node.js](https://nodejs.org/download) version and then:

```sh
npm i -g urlfuzz
```

### FROM THE REPO

```sh
git clone https://github.com/danigargu/urlfuzz
cd urlfuzz
npm i
node index --help
```

## USAGE

:rocket: To get a list of all options and switches use:

```sh
Usage: urlfuzz <URL> [OPTIONS]

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

### EXAMPLES

Fuzz using a wordlist:

`$ urlfuzz http://localhost/#FUZZ# -w big.txt`

Fuzz POST data using wordlist and filter by text:

`$ urlfuzz http://localhost/login.php -d "user=admin&pass=#FUZZ#" -w big.txt --ht denied`

Fuzz 'User-agent' header and filter by lines:

`$ urlfuzz http://localhost/exploit_kit.php -H "User-agent: #FUZZ#" -w user_agents.txt --hl 4`

Download matching files with error code 200:

`$ urlfuzz http://localhost/file-#FUZZ#.exe -b 1:3:0123456789 --hc 200 -d samples/`

Fuzz a user-id with range option:

`$ urlfuzz http://localhost/user.php?id=#FUZZ# -r 1:1000 --hc 200 --st Admin`

Export results to a CSV file:

`$ urlfuzz http://localhost/#FUZZ# -w big.txt -x log`

## THANKS

:skull: Thanks to [mandingo](https://twitter.com/m_ndingo) & [cgvwzq](https://twitter.com/cgvwzq) for the ideas during the development of the tool.

## AUTHORS

:penguin:

* Daniel García <@danigargu>
* [Contributors](https://github.com/danigargu/urlfuzz/graphs/contributors)

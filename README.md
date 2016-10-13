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
* Words
* Lines

#### Payloads

* Wordlist
* Bruteforce

## INSTALL

Simply, install the dependences with:

 `$ npm install`

## EXAMPLES

Fuzz using a wordlist:

`$ node urlfuzz.js http://localhost/#FUZZ# -w big.txt`

Fuzz POST data using wordlist and filtering by words:

`$ node urlfuzz.js http://localhost/login.php -d "user=admin&pass=#FUZZ#" -w big.txt --hw 19`

Fuzz 'User-agent' header and filtering by lines:

`$ node urlfuzz.js http://localhost/exploit_kit.php -H "User-agent: #FUZZ#" -w user_agents.txt --hl 4`

Download matching files with error code 200:

`$ node urlfuzz.js http://localhost/file-#FUZZ#.exe -b 2:2:0123456789 --hc 200 -d samples/`

## THANKS

Thanks to [mandingo](URL "https://twitter.com/m_ndingo") for the contribution of ideas during the development of the tool.

## AUTHOR

Daniel García <@danigargu>

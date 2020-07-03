## Khan Academy Extension
### [![Install](https://developer.chrome.com/webstore/images/ChromeWebStore_Badge_v2_206x58.png)](https://chrome.google.com/webstore/detail/the-khan-academy-extensio/gniggljddhajnfbkjndcgnomkddfcial) [![Install](https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_1.png)](https://addons.mozilla.org/addon/kae)
Khan Academy Extension is a browser extension for the computing section of [Khan Academy](https://khanacademy.org).


It is actively developed by [Jett Burns](https://github.com/jettburns14), [Ethan Luis McDonough](https://github.com/EthanLuisMcDonough), [Matthias Saihttam](https://github.com/MatthiasSaihttam) and [Luke Krikorian](https://github.com/lukekrikorian).

### Contributing
#### Run the extension locally:
* Run `npm install` in the extension directory.
* Make your changes!
* Run `npm run build` to build the extension.
* [Run the extension in Developer mode](https://developer.chrome.com/extensions/getstarted#unpacked)

PRs are welcomed!

### Scripts
* `npm run build` - build the extension
* `npm run clean` - clean ./dist
* `npm run lint` - check for linting errors
* `npm run fix` - clean up most linting errors automatically
* `./release.sh` - zip up the extension for release (requires [jq](https://github.com/stedolan/jq))
* `./release.sh --source` - zip up the extension source code

#### Thanks
* [Scott Schraeder](https://github.com/CosignCosine)
* [Literally Void](https://github.com/LiterallyVoid)
* [cursorweb](https://github.com/cursorweb)
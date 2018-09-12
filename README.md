## Khan Academy Extension
### [![Install](https://developer.chrome.com/webstore/images/ChromeWebStore_Badge_v2_206x58.png)](https://chrome.google.com/webstore/detail/the-khan-academy-extensio/gniggljddhajnfbkjndcgnomkddfcial)
Khan Academy Extension is a chrome extension for the computing section of [khanacademy](https://khanacademy.org).


It is actively developed by [Jett Burns](https://github.com/jettburns14), [Ethan Luis McDonough](https://github.com/EthanLuisMcDonough), and [Luke Krikorian](https://github.com/lukekrikorian).
We are currently rewriting it in [TypeScript](https://www.typescriptlang.org/). Any PRs to the [old extension](https://github.com/ka-extension/ka-extension/) will probably be ignored.

### Contributing
#### Run the extension locally:
* Run `npm install` in the extension directory.
* Make your changes!
* Run `npm run build` to build the extension.
* [Run the extension in Developer mode](https://developer.chrome.com/extensions/getstarted#unpacked)
* Create a file named .env in the root and paste `EXTENSION_ID=<INSERT YOUR EXTENSION ID HERE>` into it
* Rebuild

PRs are welcomed!

### NPM Scripts
* `npm run build` - build the extension in dev mode
* `npm run build-prod` - build the extension in production mode
* `npm run clean` - clean ./dist
* `npm run zip` - compress the current extension into ka-extension-ts.zip
* `npm run lint` - check for linting errors
* `npm run production` - build the extension in production mode and zip it

#### Thanks
* [Matthias Saihttam](https://github.com/MatthiasSaihttam)
* [Scott Schraeder](https://github.com/CosignCosine)
* [Literally Void](https://github.com/LiterallyVoid)

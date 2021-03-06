Moodle site forum mobile
==============================

Moodle site level forum on mobile with Ionic Framework

This is an app for site-level forums on Moodle.

Pre-requests on development platform:
- Node.js
- npm
- cordova
- ionic

To work with the app, you need to have a moodle site. 
- Enable "Web services" plugin on the admin site
To use ionic start and debugging web browser, you may:
- add this line "header('Access-Control-Allow-Origin: *');" to SERVER_MOODLE_DIRECTORY/login/token.php
- OR to enable proxy with the example changes in both ionic.project and controller.js file

  in ionic.project,
  "proxies": [
    {
      "path": "/moodle",
      "proxyUrl": "http://www.yoursite.com/moodle/"
    }
  ]

  in controller.js,
  set constant 'SERVER_URL' to 'http://localhost/moodle/'

With the benefits of Ionic Framework, the app can be built on both iOS and Android platforms.
Note: post replying is not support by native Moodle web service plugin.

References:
- Ionic Framework: http://ionicframework.com
- Moodle: https://moodle.org

LICENSE
==============================
Moodle site forum mobile is licensed under the MIT Open Source license.

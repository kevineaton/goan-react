# goan-react
A React component for viewing GOAN data

## Use
`npm install --save goan-react`

Ensure you have a GOAN server available to connect to. CORS is setup by the server and the client assumes a valid auth token is provided

```javascript
var Goan = require('goan-react');
...
<Goan 
    endPoint="http://localhost:44889/v1"
    auth="myauthtokenfromtheserver"
    entryType="login"/>
```

Copy the CSS file (goan.min.css) to your application to get the needed styles for the application and Datepicker.

Bootstrap is assumed but not needed; class names are provided along side the Bootstrap classes for extendability. See the source for their uses.

### Props

The following props are used to setup the interface:

- endPoint - The API endpoint for the GOAN server. For example, https://localhost:44889/v1/ - REQUIRED
- auth - The auth token for your GOAN instance - REQUIRED
- entryType - The default entry type to look up - OPTIONAL 
- from - The start date for narrowing a selection down - OPTIONAL
- to - The end date for narrowing a selection down - OPTIONAL

## Docs

Docs are written utilizing YUIDoc, which utilizes a modified form of JSDoc. To generate docs, first ensure you have YUIDoc installed

`npm install -g yuidocjs`

Once installed, run

`yuidoc -e .jsx -o docs .`

This will generate a docs subfolder (ignored in .gitignore) in the current directory.

## To Do

- [ ] Add unit testing
- [ ] Add toggle for empty dates
- [X] Improve documentation with JSDoc
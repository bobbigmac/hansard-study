#  Hansard Study

Imports data from the parliament hansard dataset, reporting all statements made my members of the parliamentary houses, and processes them to determine basic understandability metrics. 

Built just for fun.

## Running

Built with Meteor. Install that first. Then:

```bash
npm i
npm run start
# Open localhost:3000 in your browser
```

To initialise your database and start scanning, head into the console (server side) and enter:

```
Meteor.call('get-resource-files');
```

## TODO:

- Groups
- Reports
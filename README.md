#  Hansard Study

Imports data from the parliament hansard dataset, reporting all statements made by members of the parliamentary houses, and processes them to determine basic understandability metrics. 

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
- [Thesaurus](http://explore.data.parliament.uk/?learnmore=Thesaurus)
- Import attendance record
- Import tweets
- Import interests
- Analyse per-MP topics/interests
- Display chart over time
- Support importing newer datasets
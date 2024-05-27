**Setup**

Copy `config.json.example` to `config.json` and populate the fields.

> Note the `schedule.frequency` is the frequency to run the job in minutes.

> A negative `schedule.dayOfMonth` will be days from the end of the month (e.g. if it's the month of May, `-0` (or just `0`) means May 31, `-1` means May 30, etc.)

A service file has been included in this repo for you to run this in systemd. Note you'll need to update the file paths.
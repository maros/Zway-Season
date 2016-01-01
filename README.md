# Zway-Season

Creates a virtual device that stores and sets the current season. The device
can be used by other modules to determine the current season.

# Configuration

## spring, summer, autumn, winter

Stores the date when seasons should be switched. Leaving a date empty results
in the season being skipped.

# Events

Events are emitted whenever a season switch occurs

* season.spring
* season.summer
* season.autumn
* season.winter

# Virtual Devices

Creates a virtual device that shows the current season. The next season
can be activated ahead of time by pushing the control button.

# Installation

```shell
cd /opt/z-way-server/automation/modules
git clone https://github.com/maros/Zway-Season.git Season --branch latest
```

To update or install a specific version
```shell
cd /opt/z-way-server/automation/modules/Season
git fetch --tags
# For latest released version
git checkout tags/latest
# For a specific version
git checkout tags/1.02
# For development version
git checkout -b master --track origin/master
```

Alternatively this module can be installed via the Z-Wave.me app store. Just
go to Management > App Store Access and add 'k1_beta' access token. 

# License

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or any 
later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

/*** Season Z-Way HA module *******************************************

Version: 1.00
(c) Maroš Kollár, 2015
-----------------------------------------------------------------------------
Author: maros@k-1.com <maros@k-1.com>
Description:
    This module sets the current season. Season may be used as input by other
    modules.

******************************************************************************/

function Season (id, controller) {
    // Call superconstructor first (AutomationModule)
    Season.super_.call(this, id, controller);
    
    this.vDev           = undefined;
    this.seasonDates    = {};
}

inherits(Season, AutomationModule);

_module = Season;

// ----------------------------------------------------------------------------
// --- Module instance initialized
// ----------------------------------------------------------------------------

Season.prototype.init = function (config) {
    Season.super_.prototype.init.call(this, config);

    var self = this;
    var langFile = self.controller.loadModuleLang("Season");

    // Create vdev
    this.vDev = this.controller.devices.create({
        deviceId: "Season_" + this.id,
        defaults: {
            metrics: {
                title: langFile.title,
                level: 'off',
                season: 'none'
            }
        },
        overlay: {
            deviceType: 'toggleButton'
        },
        handler: function(command) {
            if (command === 'on') {
                self.vDev.set('metrics:level','on');
                self.switchSeason(self.nextSeason());
            }
        },
        moduleId: this.id
    });
    
    self.calculateSeasonDates();
    
    // Initial season
    /*
    if (this.vDev.get('metrics:season') === 'none') {
        self.switchSeason(
            _.find(
                self.seasonsDates, 
                function(season) {
                    return season.current
                }
            )
        );
    }
    */
    
    // Next season
    var nextSeason  = self.nextSeason();
    var startSeason = self.getSeasonStart(nextSeason);
    
    say('[Season] Next season is'+nextSeason);
    say('[Season] Next season is'+startSeason);
    self.nextSeason = setTimeout(
        _.bind(self.switchSeason,self,nextSeason),
        startSeason
    )
    */

};

Season.prototype.stop = function () {
    var self = this;
    
    if (self.vDev) {
        self.controller.devices.remove(self.vDev.id);
        self.vDev = undefined;
    }
    
    clearTimeout(self.nextSeason);
    Season.super_.prototype.stop.call(this);
};

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------

Season.prototype.seasons = ['spring','summer','fall','winter'];

Season.prototype.switchSeason = function (season) {
    var self = this;
    console.log('[Season] CALLED SEASON SWITCH '+season);
};

Season.prototype.nextSeason = function () {
    var self = this;
    
    var thisSeason  = self.vDev.set('metrics:season');
    var indexSeason = _.indexOf(self.seasons,thisSeason);
    var newSeason;
    while (typeof(newSeason) === 'undefined') {
        indexSeason++;
        if (indexSeason > self.seasons.length) {
            indexSeason = 0;
        }
        var seasonStart = self.config[indexSeason];
        if (typeof(seasonStart) === 'string'
            && seasonStart !== '') {
            newSeason = self.seasons[indexSeason];
        }
    }
    return newSeason;
};

Season.prototype.calculateSeasonDates = function () {
    var self = this;
    
    console.log('[Season] Init table');
    var dateNow     = new Date();
    var dateRe      = /^(\d+)\/(\d+)$/;
    var seasons     = [];
    var match, previous;
    
    _.each(self.seasons,function(season) {
        var seasonStart = self.config[season];
        if (typeof(seasonStart) === 'string') {
            match = seasonStart.match(dateRe);
            if (match) {
                seasons.push({
                    season: season,
                    month: match[0],
                    day: match[1],
                    start: new Date(dateNow.getFullYear(), parseInt(match[0]), parseInt(match[1]), 0, 0, 0, 0),
                    end: undefined
                });
            }
        }
    });
    
    previous = seasons[seasons.length - 1];
    _.each(seasons,function(season) {
        season.end = previous.start;
        previous = season;
    });
    
    _.each(seasons,function(season) {
        if (season.start > season.end) {
            if (dateNow > season.end) {
                season.end.setFullYear(dateNow.getFullYear() + 1);
            } else {
                season.start.setFullYear(dateNow.getFullYear() - 1);
            }
        }
        if (season.end < dateNow) {
            season.start.setFullYear(season.start.getFullYear() + 1);
            season.end.setFullYear(season.end.getFullYear() + 1);
        }
        
        self.seasonDates = { 
            start:      season.start,
            end:        season.end,
            current:    (season.start < dateNow && dateNow < season.end)
        };
    });
    
    console.logJS(self.seasonDates);
};

/*
Season.prototype.calculateSeason = function () {
    var self = this;
    
    var seasons     = {};
    var calcSeason;
    
    _.each(self.seasons,function(season) {
        var seasonStart = self.getSeasonPeriod(season);
        
        
        
        if (typeof(calcSeason) === 'undefined') {
            if (typeof(seasonStart) !== 'undefined') {
                
            }
            
            
        }
        
            && typeof(calcSeason) === 'undefined') {
                && dateNow <= dateCompare) {
                calcSeason = season;
                seasons.push(season);
            }
        }
    });
    
    return calcSeason;
};

*/
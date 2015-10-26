/*** Season Z-Way HA module *******************************************

Version: 1.01
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
    this.seasonDates    = [];
}

inherits(Season, AutomationModule);

_module = Season;

// ----------------------------------------------------------------------------
// --- Module instance initialized
// ----------------------------------------------------------------------------

Season.prototype.init = function (config) {
    Season.super_.prototype.init.call(this, config);

    var self = this;
    self.langFile = self.controller.loadModuleLang("Season");

    // Create vdev
    this.vDev = this.controller.devices.create({
        deviceId: "Season_" + this.id,
        defaults: {
            metrics: {
                title: 'Season',
                title: self.langFile.title,
                level: 'none'
            }
        },
        overlay: {
            deviceType: 'toggleButton'
        },
        handler: function(command) {
            if (command === 'on') {
                self.switchSeason(self.nextSeason().season);
            }
        },
        moduleId: this.id
    });
    
    self.calculateSeasonDates();
    
    // Initial season
    if (this.vDev.get('metrics:level') === 'none') {
        var currentSeason = _.find(self.seasonDates,function(season,season2) {
            return season.current;
        });
        self.switchSeason(currentSeason.season);
    } else {
        self.timeoutSeason();
    }
};

Season.prototype.stop = function () {
    var self = this;
    
    if (self.vDev) {
        self.controller.devices.remove(self.vDev.id);
        self.vDev = undefined;
    }
    
    clearTimeout(self.timeout);
    self.timeout = undefined;
    
    Season.super_.prototype.stop.call(this);
};

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------

Season.prototype.seasons = ['spring','summer','autumn','winter'];


Season.prototype.timeoutSeason = function (season) {
    var self = this;
    
    if (typeof(self.timeout) !== 'undefined') {
        clearTimeout(self.timeout);
        self.timeout = undefined;
    }
    
    // Next season
    var nextSeason = self.nextSeason();
    
    if (typeof(nextSeason) !== 'undefined') {
        var timeout = nextSeason.start.getTime() - (new Date().getTime());
        if (timeout > 0) {
            self.timeout = setTimeout(
                _.bind(self.switchSeason,self,nextSeason.season),
                timeout
            );
        } else {
            self.switchSeason(nextSeason.season);
        }
    }
};

Season.prototype.switchSeason = function (season) {
    var self = this;
    
    console.log('[Season] Switched season to '+season);
    
    self.vDev.set('metrics:level',season);
    self.vDev.set('metrics:title',self.langFile[season + '_label']);
    self.vDev.set('metrics:icon',"/ZAutomation/api/v1/load/modulemedia/Season/icon_"+season+".png");
    
    self.controller.emit("season.switch", {
        source: self.id,
        season: season
    });
    
    self.controller.emit("season."+season, {
        source: self.id
    });
    
    self.timeoutSeason();
};

Season.prototype.nextSeason = function () {
    var self = this;
    
    var thisSeason  = self.vDev.get('metrics:level');
    var thisIndex   = _.findIndex(self.seasonDates,function(season) {
        return season.season === thisSeason;
    });
    
    if (thisIndex === -1) {
        return;
    }
    
    thisIndex++;
    if (thisIndex >= self.seasonDates.length) {
        thisIndex = 0;
    }
    return self.seasonDates[thisIndex];
};

Season.prototype.calculateSeasonDates = function () {
    var self = this;
    
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
        
        self.seasonDates.push({
            season:     season.season,
            start:      season.start,
            end:        season.end,
            current:    (season.start < dateNow && dateNow < season.end)
        });
    });
    
    return self.seasonDates;
};

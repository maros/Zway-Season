/*** Season Z-Way HA module *******************************************

Version: 1.03
(c) Maroš Kollár, 2015
-----------------------------------------------------------------------------
Author: Maroš Kollár <maros@k-1.com>
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
                title: self.langFile.m_title,
                level: 'none'
            }
        },
        overlay: {
            probeType: 'Season',
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
    
    self.controller.on('season.switch',_.bind(self.switchSeason,self));
    
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
    
    self.controller.off('season.switch');
    self.controller.emit("cron.removeTask","season.switch");
    
    Season.super_.prototype.stop.call(this);
};

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------

Season.prototype.seasons = ['spring','summer','autumn','winter'];

Season.prototype.timeoutSeason = function (season) {
    var self = this;
    
    // Next season
    var nextSeason  = self.nextSeason();
    var now         = new Date();
    
    if (typeof(nextSeason) !== 'undefined') {
        if (nextSeason.start > now) {
            console.log('[Season] Add cron for '+nextSeason.start);
            self.controller.emit("cron.addTask","Season.switch", {
                minute:     0,
                hour:       0,
                weekDay:    null,
                day:        nextSeason.start.getDate(),
                month:      nextSeason.start.getMonth()+1
            },nextSeason.season);
        } else {
            self.switchSeason(nextSeason.season);
        }
    }
};

Season.prototype.switchSeason = function (newSeason) {
    var self = this;
    
    console.log('[Season] Switched season to '+newSeason);
    
    var oldSeason = self.vDev.get('metrics:level');
    
    self.vDev.set('metrics:level',newSeason);
    self.vDev.set('metrics:title',self.langFile[newSeason + '_label']);
    self.vDev.set('metrics:icon',"/ZAutomation/api/v1/load/modulemedia/Season/icon_"+newSeason+".png");
    
    if (oldSeason !== newSeason) {
        self.controller.emit("cron.removeTask","season.switch");
        self.controller.emit("season."+newSeason);
        
        var notification = self.langFile;
        notification.replace("[OLD_SEASON]", self.langFile[oldSeason + '_label']);
        notification.replace("[NEW_SEASON]", self.langFile[newSeason + '_label']);
        self.controller.addNotification("notification",notification, "module", "Season");
    }
    
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
                    start: new Date(dateNow.getFullYear(), parseInt(match[0],10), parseInt(match[1],10), 0, 0, 0, 0),
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

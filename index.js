/*** Season Z-Way HA module *******************************************

Version: 1.00
(c) Maroš Kollár, 2015
-----------------------------------------------------------------------------
Author: maros@k-1.com <maros@k-1.com>
Description:
    This module checks weather condition and optional binary sensors to
    detect rain

******************************************************************************/

function Season (id, controller) {
    // Call superconstructor first (AutomationModule)
    Season.super_.call(this, id, controller);
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
                season: self.calculateSeason()
            }
        },
        overlay: {
            deviceType: 'toggleButton'
        },
        handler: function(command) {
            if (command === 'on') {
                self.vDev.set('metrics:level','on');
                self.switchSeason();
            }
        },
        moduleId: this.id
    });
    
    

};


Season.prototype.stop = function () {
    var self = this;
    
    if (self.vDev) {
        self.controller.devices.remove(self.vDev.id);
        self.vDev = undefined;
    }
    
    Season.super_.prototype.stop.call(this);
};

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------

Season.prototype.seasons = ['spring','summer','fall','winter'];

Season.prototype.switchSeason = function (season) {
    var self = this;
    console.log('CALLED SEASON '+season);
};

Season.prototype.calculateSeason = function () {
    var self = this;
    
    var dateNow     = new Date();
    var dateRe      = /^(\d+)\/(\d+)$/;
    var seasons     = [];
    var calcSeason;
    
    _.each(self.seasons,function(season) {
        
        var seasonStart = self.config[season];
        if (typeof(seasonStart) === 'string'
            && seasonStart !== '') {
            var match = dateRe.exec(seasonStart);
            var dateCompare = new Date(dateNow.getFullYear(), match[0], match[1], 0, 0, 0, 0);
            if (typeof(calcSeason) === 'undefined' 
                && dateNow <= dateCompare) {
                calcSeason = season;
                seasons.push(season);
            }
        }
    });
    
    console.logJS(seasons);
    console.log(calcSeason);
    
    
    return calcSeason;
};
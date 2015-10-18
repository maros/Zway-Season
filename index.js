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
            }
        },
        overlay: {
            deviceType: 'toggleButton'
        },
        handler: function(command) {
            console.log('CALLED SEASON '+command);
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


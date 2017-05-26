'use strict';

angular.module('WebtroPie.config_service', [])

.service('config', function($http, $q, $httpParamSerializer, util)
{
   var self = this;

   // Config sections
   self.APP = 1;   // this app config
   self.ENV = 2;   // environmental info
   self.LANG = 4;  // current language
   self.ES = 8;    // emulationstation settings
   self.THEMES = 16;    // theme tweaks
   self.ALL = 255;

   self.menu = {};
   self.menu.main = [
     {text: 'UI SETTINGS',      type: 'menu', action: 'menu-ui.html'},
     {text: 'OTHER SETTINGS',   type: 'menu', action: 'menu-other.html'},
     {text: 'HELPBAR SETTINGS', type: 'menu', action: 'menu-helpbar.html'},
   ];

   self.menu_history = [];

   self.showMenu = function()
   {
      self.menu_template = "menu.html";
      self.menu_history.length = 0;
      self.show_menu = true;
   }

   self.hideMenu = function()
   {
      self.show_menu = false;
      self.menu_history.length = 0;
      util.defaultFocus();
   }

   self.goMenu = function(template)
   {
      self.menu_history.push(self.menu_template);
      self.menu_template = template;
   }

   self.exitMenu = function()
   {
      if (self.menu_history.length < 1)
      {
         self.hideMenu();
      }
      else
      {
         self.menu_template = self.menu_history[self.menu_history.length-1];
         self.menu_history.length--;
      }
   }

   self.toggleMenu = function()
   {
      if (!self.show_menu)
      {
         self.showMenu();
      }
      else
      {
         self.hideMenu();
      }

   }

   self.menuKeyPress = function($event)
   {
      if ($event.keyCode == 27)  // Escape
      {
         self.exitMenu();
      }
   }

   // get either from memory or server
   self.init = function(get, lang, refresh)
   {
      if (!get) get = self.ALL; // default: get everything
      if (self.promise && !refresh)  // already got settings
      {
         return self.promise;
      }

      var deferred = $q.defer();

      // fetch from server
      $http.get('svr/settings.php', {cache: false, params: {get: get, lang: lang}})
      .then(function onSuccess(response)
      {
         if (get & self.APP) self.app = response.data.app;
         if (get & self.ENV) self.env = response.data.env;
         if (get & self.LANG) self.lang = response.data.lang;
         if (get & self.ES) self.es = response.data.es;
         if (get & self.THEMES) self.themes = response.data.themes.theme;
         deferred.resolve();
      });

      if (get == self.ALL)
      {
         self.promise = deferred.promise;
      }

      return deferred.promise;
   }

   self.save = function(setting, value)
   {
      var update = {update: 1,
                    setting: setting,
                      value: value};
      $http({
         method  : 'POST',
         url     : 'svr/settings.php',
         headers : { 'Content-Type': 'application/x-www-form-urlencoded' },
         data    : $httpParamSerializer(update)
      });

   }

   self.formatDate = function(text, format)
   {
      if (!format)
      {
         format = self.app.DateFormat || 'dd/mm/yyyy';
      }
      return format
                 .replace(/yyyy/i, text.substring(0,4))
                 .replace(/mm/i,   text.substring(4,6))
                 .replace(/dd/i,   text.substring(6,8)) 
                 .replace(/hh/i,   text.substring(9,11)) 
                 .replace(/mi/i,   text.substring(11,13)) 
                 .replace(/ss/i,   text.substring(13,15));
   }

});

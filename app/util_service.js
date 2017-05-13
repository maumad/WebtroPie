'use strict';

angular.module('WebtroPie.util', [])

.service('util', function($timeout, $location, $window, $route, $q, $http)
{
   var self = this;

   self.history = [];

   // history management
   self.go = function(path)  // replace current page : no history
   {
      if ($location.path() == path)
      {
         $route.reload();
      }
      else
      {
         $location.path(path).replace();
      }
   }

   self.call = function(path)  // generate history : to return
   {
      self.history.push($location.path());
      $location.path(path);
   }

   self.back = function(path)  // return to page
   {
      if (self.history.length>0)
      {
         var last = self.history[self.history.length-1];
         self.history.length--;
         if (path == last)
         {
            $window.history.back();
            return;
         }
      }
      self.go(path);
   }

   // round a number to 'decimals' decimal places
   self.round = function(value, decimals)
   {
      return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
   }

   // given float 'f' (range 0 to 1) return either '0' or '(f*100)%'
   self.pct = function(f, pct)
   {
      return f == 0 ? 0 : self.round(f*100,4)+pct;
   }

   // convert "#RRGGBBAA" hex to string "rgba(r,g,b,a)" (decimal x 3 + float)
   self.hex2rgba = function(hex)
   {
      if (!hex)
      {
         return '';
      }

      if (hex.length == 6)
      {
         return '#'+hex;
      }

      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return 'rgba('+parseInt(result[1], 16)+','+
                     parseInt(result[2], 16)+','+
                     parseInt(result[3], 16)+','+
                     self.round(parseInt(result[4], 16)/255,2)+')';
   }

   // convert "#RRGGBBAA" hex to string "rgba(r,g,b,a)" (decimal x 3 + float)
   self.invert = function(hex)
   {
      if (!hex)
      {
         return '';
      }

      if (hex.length >= 6 )
      {
         var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(hex);
         return 'rgb('+(255-parseInt(result[1], 16))+','+
                       (255-parseInt(result[2], 16))+','+
                       (255-parseInt(result[3], 16))+')';
      }
      else
      {
         var result = /^#?([a-f\d])([a-f\d])([a-f\d])/i.exec(hex);
         return 'rgb('+(15-parseInt(result[1], 16))+','+
                       (15-parseInt(result[2], 16))+','+
                       (15-parseInt(result[3], 16))+')';
      }
   }

   self.isLight = function(col)
   {
      if (col[0] == '#') col = col.substring(1);
      if (col.length == 3)
      {
         //if (col.substring(0,1)<'8' &&
             //col.substring(1,2)<'8' &&
             //col.substring(2,3)<'8')
            //return false;
         if (col.substring(0,1)>'6' ||
             col.substring(1,2)>'5' ||
             col.substring(2,3)>'a')
            return true;
      }
      else if (col.length >= 6)
      {
         //if (col.substring(0,1)<'8' &&
             //col.substring(2,3)<'8' &&
             //col.substring(4,5)<'8')
            //return false;
         if (col.substring(0,1)>'6' ||
             col.substring(2,3)>'5' ||
             col.substring(4,5)>'a')
            return true;
      }
      return false;
   }

   self.isDark = function(col)
   {
      return !self.isLight(col);
   }

   self.isVeryDark = function(col)
   {
      if (col[0] == '#') col = col.substring(1);
      if (col.length == 3)
      {
         if (col.substring(0,1)<'4' &&
             col.substring(1,2)<'4' &&
             col.substring(2,3)<'4')
            return true;
      }
      else if (col.length >= 6)
      {
         if (col.substring(0,1)<'4' &&
             col.substring(2,3)<'4' &&
             col.substring(4,5)<'4')
            return true;
      }
      return false;
   }

   // convert '#RRGGBBAA' hex to object {h,s,l,a} decimal
   self.rgbToHSL = function(rgb)
   {
      // strip the leading # if it's there
      rgb = rgb.replace(/^\s*#|\s*$/g, '');

      // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
      if (rgb.length == 3)
      {
         rgb = rgb.replace(/(.)/g, '$1$1');
      }

      var r = parseInt(rgb.substr(0, 2), 16) / 255,
          g = parseInt(rgb.substr(2, 2), 16) / 255,
          b = parseInt(rgb.substr(4, 2), 16) / 255,
          a = parseInt(rgb.substr(6, 2), 16) / 255,
          cMax = Math.max(r, g, b),
          cMin = Math.min(r, g, b),
          delta = cMax - cMin,
          l = (cMax + cMin) / 2,
          h = 0,
          s = 0;
      if (delta == 0)
         h = 0;
      else if (cMax == r)
         h = 60 * (((g - b) / delta) % 6);
      else if (cMax == g)
         h = 60 * (((b - r) / delta) + 2);
      else
         h = 60 * (((r - g) / delta) + 4);

      if (delta == 0)
         s = 0;
      else
         s = (delta/(1-Math.abs(2*l - 1)))

      return {
         h: self.round(h,4),
         s: self.round(s,4),
         l: self.round(l,4),
         a: self.round(a,4)
      }
   }

   self.register_keyPressCallback = function(callback)
   {
      self.keyPressCallback = callback;
   }

   self.keyPress = function($event)
   {
//console.log('keyCode = ' + $event.keyCode);
      if ($event.keyCode == 91)
      {
         self.commandDown = true;  // left command
      }
      if ($event.keyCode == 93)
      {
         self.commandDown = true;  // right command
      }
      if (self.keyPressCallback)
      {
         if (!self.keyPressCallback($event))
         {
            $event.preventDefault();
         }
      }
   }

   self.keyRelease = function($event)
   {
      if ($event.keyCode == 91)
      {
         self.commandDown = false;  // left command
      }
      if ($event.keyCode == 93)
      {
         self.commandDown = false;  // right command
      }
   }

   self.register_defaultFocus = function(selector)
   {
      self.defaultFocusSelector = selector;
      self.defaultFocus();
   }

   self.defaultFocus = function()
   {
      if (self.defaultFocusSelector)
      {
         self.focus(self.defaultFocusSelector);
      }
   }

   self.focus = function(selector)
   {
      $timeout(function()
      {
         var el = angular.element(document.querySelector(selector));
         if (el && el.length > 0)
         {
            el[0].focus();
         }
      });
   }

   self.nextButton = function(el)
   {
      var node = el.nextSibling;
      while (node)
      {
         // button and not hidden
         if (node.tagName=='BUTTON' && (node.className !== 'ng-hide'))
         {
            node.focus();
            break;
         }
         node = node.nextSibling;                
      }
   }

   self.prevButton = function(el)
   {
      var node = el.previousSibling;
      while (node)
      {
         // button and not hidden
         if (node.tagName=='BUTTON' && (node.className !== 'ng-hide'))
         {
            node.focus();
            break;
         }
         node = node.previousSibling;                
      }
   }

   // search an array of objects for a matching field
   // then either return its index, delete it, return requested field or the whole object
   self.searchArrayByObjectField = function(obj_array, key, val, ret)
   {
      if (!obj_array)
         return;
      for (var i=0; i<obj_array.length; i++)
      {
         if (obj_array[i][key] == val)
         {
            if (ret == 'index')
               return i;
            else if (ret == 'del')
               return obj_array.splice(i, 1);
            else if (ret)
               return obj_array[i][ret];
            else
               return obj_array[i];
         }
      }
      if(ret == 'index')
         return -1;
   }

   self.waitForRender = function(scope)
   {
      var deferred = $q.defer();

      // do at least one digest cycle
      if (!scope.$$phase)
      {
         scope.$apply();
      }
      else
      {
         scope.$evalAsync();
      }
      var waitForRender = function() {
         if ($http.pendingRequests.length > 0)
         {
            $timeout(waitForRender);
         }
         else
         {
            deferred.resolve();
         }
      }
      $timeout(waitForRender);
      return deferred.promise;
   }
});

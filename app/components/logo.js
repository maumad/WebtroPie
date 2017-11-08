/**
 * logo.js
 *
 * Show an a system logo image using button element, used on system view carousel
 */
(function() {

   'use strict';

   angular
      .module('WebtroPie.components',[])
      .directive('logo', logo);

   function logo()
   {
      var directive = {
         restrict: 'E',
         replace: true,
         scope: { obj: '=' },
         template: '<button class="systemlogo"'+
                   ' style="background-image: {{obj.logo}}">'+
                    '{{obj.logo ? "" : obj.name }}'+
                   '</button>'
      }
      return directive;
   }

})();


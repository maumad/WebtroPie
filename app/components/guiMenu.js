/**
 * menu.directive.js
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie')
        .directive('menu', menu);

    function menu()
    {
        var directive = {
            template: '<div ng-include="app.menu.template"></div>'
        }
        return directive;
    }

})();

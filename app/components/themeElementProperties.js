/**
 * themeElementProperties.js
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.components')
        .directive('themeElementProperties', themeElementProperties);

    function themeElementProperties() {
        var directive = {
            restrict: 'E',
            replace: true,
            templateUrl: 'components/themeElementProperties.html',
            controller: controller,
            controllerAs: 'pm'
        }
        return directive;
    }

    controller.$inject = ['$scope','ThemerService'];

    function controller($scope, ThemerService)
    {
        var pm = this;
        pm.$onInit = onInit;

        function onInit()
        {
            $scope.$watch(function() { return ThemerService.element; }, elementChanged);
        }

        function elementChanged(element)
        {
            pm.element = element;
        }
    }

})();

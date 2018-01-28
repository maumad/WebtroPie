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
            template: '<div class="element-properties" '+
                          'ng-show="pm.element">'+
                          'name: {{pm.element.name}}<br />'+
                          'pos: {{pm.element.pos.x}} {{pm.element.pos.y}}<br />'+
                          'size: {{pm.element.size.w}} {{pm.element.size.h}}<br />'+
                          'maxSize: {{pm.element.maxSize.w}} {{pm.element.maxSize.h}}<br />'+
                          'origin: {{pm.element.origin.x}} {{pm.element.origin.y}}<br />'+
                          'zIndex: {{pm.element.zIndex}} ({{pm.style[\'z-index\']}})<br />'+
                      '</div>',
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

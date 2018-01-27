/**
 * themeElement.js
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.components')
        .directive('themeElementInfo', themeElementInfo);

    function themeElementInfo() {
        var directive = {
            restrict: 'E',
            replace: true,
            template: '<div class="elementinfo"'+
                          ' ng-show="vm.element" '+
                          ' ng-style="vm.style">'+
                        'name: {{vm.element.name}}<br />'+
                        'pos: {{vm.element.pos.x}} {{vm.element.pos.y}}<br />'+
                        'size: {{vm.element.size.w}} {{vm.element.size.h}}<br />'+
                        'maxSize: {{vm.element.maxSize.w}} {{vm.element.maxSize.h}}<br />'+
                        'origin: {{vm.element.origin.x}} {{vm.element.origin.y}}<br />'+
                        'zIndex: {{vm.element.zIndex}} ({{vm.style[\'z-index\']}})<br />'+
                      '</div>',
            controller: controller,
            controllerAs: 'vm'
        }
        return directive;
    }

    controller.$inject = ['$scope','$element','config','ThemerService'];

    function controller($scope, $element, config, ThemerService)
    {
        var vm = this;
        vm.$onInit = onInit;
        vm.style = {};

        function onInit()
        {
            ThemerService.infoScope = $scope;
            $scope.$watch(function() { return ThemerService.element; }, elementChanged);
        }

        function elementChanged(element)
        {
            vm.element = element;
            if(element)
            {
                var style = element.div || element.style || element.img;
                if (style)
                {
                    vm.style.left = style.left;
                    vm.style.top = style.top;
                    vm.style.width = style.width || style['max-width'];
                    vm.style.height = style.height || style['max-height'];
                    //vm.style['max-width'] = style['max-width'];
                    //vm.style['max-height'] = style['max-height'];
                    vm.style['z-index'] = style['z-index'];
                    vm.style.transform = style.transform;
                }
            }
        }
    }

})();

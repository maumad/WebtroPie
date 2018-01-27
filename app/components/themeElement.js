/**
 * themeElement.js
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.components')
        .directive('themeElement', themeElement);

    function themeElement() {
        var directive = {
            restrict: 'A',
            replace: false,
            controller: controller
        }
        return directive;
    }

    controller.$inject = ['$scope','$element','config','ThemerService'];

    function controller($scope, $element, config, ThemerService)
    {
        this.$onInit = onInit;

        function onInit()
        {
            $element
            .bind('mouseover', function ($event) {
                if (config.app.ThemeEditor)
                {
                    $event.stopPropagation();
                    $event.preventDefault();
                    ThemerService.setElement($scope.vm.obj);
                }
            });
        }
    }

})();

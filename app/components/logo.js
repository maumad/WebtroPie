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
            scope: true,
            template: '<button class="systemlogo click"'+
                         ' ng-style="{\'background-image\': vm.logo}">'+
                          '{{vm.logo ? "" : vm.name}}'+
                      '</button>',
            controller: controller,
            controllerAs: 'vm',
            bindToController: { systemName: '=' }
        }
        return directive;
    }

    controller.$inject = ['$scope','config','ThemeService'];

    function controller($scope, config, ThemeService)
    {
        var vm = this;

        $scope.$watch(function() { return ThemeService.theme; }, update)

        function update()
        {
            var system = config.systems[vm.systemName];
            var theme = ThemeService.getSystemTheme(vm.systemName);
            if (theme && theme.logo)
            {
                vm.logo = ThemeService.variableReplace(theme.logo, vm.systemName);
            }
            else
            {
                delete vm.logo;
            }
            vm.name = system.fullname || vm.systemName
        }
    }

})();


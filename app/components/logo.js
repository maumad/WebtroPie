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

    controller.$inject = ['$scope','config','ThemeService','styler'];

    function controller($scope, config, ThemeService, styler)
    {
        var vm = this;

        $scope.$watch(function() { return ThemeService.theme; }, update)

        function update()
        {
            var themeSystem = ThemeService.theme.carousel_systems[vm.systemName].themeSystem;
            var theme = ThemeService.getSystemTheme(themeSystem);
            var system = config.systems[vm.systemName];

            if (theme && theme.logo)
            {
                vm.logo = styler.variableReplace(theme.logo, vm.systemName);
            }
            else
            {
                delete vm.logo;
            }
            vm.name = system.fullname || vm.systemName;
        }
    }

})();


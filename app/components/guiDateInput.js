/**
 * date-input.directive.js
 *
 * ngModel is text date in format used by emulationstation gamelist.xml
 * date is a js date
 *
 * as either of these changes update the other so that the browser datepicker works correctly
 * and two way binding occurs
 */
(function() {

   'use strict';

   angular
      .module('WebtroPie')
      .directive('dateInput', dateInput);

   function dateInput() {
      var directive = {
         restrict: 'E',
         replace: false,
         scope: true,
         template: '<input type=date ng-model="vm.date"/>',
         controller: controller,
         controllerAs: 'vm',
         bindToController: {ngModel: '='}
      }
      return directive;
   }

   controller.$inject = ['$scope'];

   function controller($scope)
   {
      var vm = this;
      vm.$onInit = onInit;

      function onInit()
      {
         $scope.$watch('vm.date', dateChanged);
         $scope.$watch('vm.ngModel', modelChanged);
      }

      function dateChanged(date)
      {
         if (date == vm.last_date) // prevent endless loop
         {
            return;
         }
         if (!date)
         {
            vm.last_model = vm.ngModel = null;
         }
         else
         {
            vm.last_model = vm.ngModel =
                date
                .toISOString()
                .replace(/[:-]/g,'')
                .substring(0,15);
         }
      }

      function modelChanged(model)
      {
         if (model == vm.last_model) // prevent endless loop
         {
            return;
         }
         var year, month, day, hours, minutes, seconds;
         if (model.length>=4)  year    = parseInt(model.substring(0,4));
         if (model.length>=6)  month   = parseInt(model.substring(4,6));
         if (model.length>=8)  day     = parseInt(model.substring(6,8));
         if (model.length>=11) hours   = parseInt(model.substring(9,11));
         if (model.length>=13) minutes = parseInt(model.substring(11,13));
         if (model.length>=15) seconds = parseInt(model.substring(13,15));
         vm.last_date = vm.date = new Date(year, month-1, day, hours, minutes, seconds);
      }
   }

})();

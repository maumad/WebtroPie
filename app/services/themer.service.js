/**
 * themer.service.js
 */
(function () {

    'use strict';

    angular
        .module('WebtroPie.themer_service', [])
        .service('ThemerService', service);

    //service.$inject = ['config', 'util', 'styler', '$http', '$q', '$document', '$window'];

    function service() //config, util, styler, $http, $q, $document, $window)
    {
        var self = this;
        self.setElement = setElement;

        function setElement(obj)
        {
            self.element = obj;
            if (self.infoScope)
            {
                self.infoScope.$evalAsync();
            }
        }

    }

})();

/**
 * carousel.service.js
 */
(function () {

    'use strict';

    angular
        .module('WebtroPie.carousel_service', [])
        .service('CarouselService', service);

    service.$inject = ['ThemeService','GameService', 'config', 'util', 'styler'];

    function service(ThemeService, GameService, config, util, styler)
    {
        var self = this;

        // Variables :-

        // index pointing to the system in self.theme.carousel_systems_list array
        self.system_index = 0; // the first index in the array (alphabetically sorted)

        // public functions
        self.centerOffset = centerOffset;
        self.getCarouselSystemName = getCarouselSystemName;
        self.getCarouselSystemTheme = getCarouselSystemTheme;
        self.getCurrentCarouselSystemName = getCurrentCarouselSystemName;
        self.getRelativeCarouselSystemName = getRelativeCarouselSystemName;
        self.getRelativeCarouselSystemTheme = getRelativeCarouselSystemTheme;
        self.goCurrentCarouselSystem = goCurrentCarouselSystem;
        self.goNextCarouselSystemGamelist = goNextCarouselSystemGamelist;
        self.goPreviousCarouselSystemGamelist = goPreviousCarouselSystemGamelist;
        self.goSystemDetail = goSystemDetail;
        self.nextCarouselSystem = nextCarouselSystem;
        self.previousCarouselSystem = previousCarouselSystem;
        self.setCarouselSystemByIndex = setCarouselSystemByIndex;
        self.setCarouselSystemIndexByName = setCarouselSystemIndexByName;
        self.wrapIndex = wrapIndex;

        function centerOffset(index)
        {
            return wrapIndex(index + ThemeService.theme.mid_index - self.system_index)-ThemeService.theme.mid_index;
        }

        function getCarouselSystemName(system_index)
        {
            return ThemeService.theme.carousel_systems_list[wrapIndex(system_index)]
        }

        function getCarouselSystemTheme(system_index)
        {
            return ThemeService.getSystemTheme(getCarouselSystemName(system_index));
        }

        // return E.g previous or next system name
        function getRelativeCarouselSystemName(offset)
        {
            return getCarouselSystemName(self.system_index + offset)
        }

        function getCurrentCarouselSystemName()
        {
            return getRelativeCarouselSystemName(0);
        }

        // return E.g previous or next system theme
        function getRelativeCarouselSystemTheme(change_ix)
        {
            return ThemeService.getSystemTheme(getRelativeCarouselSystemName(parseInt(change_ix)));
        }

        function goCurrentCarouselSystem(replace)
        {
            goSystemDetail(self.system_index, replace)
        }

        function goNextCarouselSystemGamelist(replace)
        {
            self.system_index++;
            goCurrentCarouselSystem(replace)
        }

        function goPreviousCarouselSystemGamelist(replace)
        {
            self.system_index--;
            goCurrentCarouselSystem(replace)
        }

        // navigate to the rom lists view
        function goSystemDetail(system_index, replace)
        {
            ThemeService.playSound('systemselect');

            var system_name = getCarouselSystemName(system_index);

            if (replace)
            {
                util.go('/'+system_name);
            }
            else
            {
                util.call('/'+system_name);
            }
        }


        // roll systems right 1 by default (or any other non zero number)
        function nextCarouselSystem(change_ix, keep_style)
        {
            if (!change_ix)
            {
                change_ix = 1;
            }
            ThemeService.playSound('systemscroll');
            self.setCarouselSystemByIndex(self.system_index + change_ix, null, keep_style);
        }


        // roll systems left
        function previousCarouselSystem(change_ix, keep_style)
        {
            if (!change_ix)
            {
                change_ix = 1;
            }
            self.setCarouselSystemByIndex(self.system_index - change_ix, null, keep_style);
            ThemeService.playSound('systemscroll');
        }

        // change system by system index
        function setCarouselSystemByIndex(system_index, view_name, keep_style)
        {
            self.system_index = wrapIndex(system_index);
            ThemeService.setSystem(getCarouselSystemName(system_index), view_name, keep_style);
        }
        function setCarouselSystemIndexByName(system_name)
        {
            self.system_index = ThemeService.theme.carousel_systems_list.indexOf(system_name);
        }

        // ensure index is always between 0 and array.length
        function wrapIndex(index)
        {
            return (index + ThemeService.theme.carousel_systems_list.length)
                % ThemeService.theme.carousel_systems_list.length;
        }
    }

})();

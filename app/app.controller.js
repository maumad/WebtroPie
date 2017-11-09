/**
 * main app controller
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie')
        .controller('AppController', controller);

    controller.$inject = ['$scope','config','util','styler', 'ThemeService','GameService','CarouselService'];
        
    function controller($scope, config, util, styler, ThemeService, GameService, CarouselService)
    {
        var app = this;

        // methods
        app.dateFormatChanged = dateFormatChanged;
        app.exitMenu = exitMenu;
        app.goMenu = goMenu;
        app.hideMenu = hideMenu;
        app.languageChanged = languageChanged;
        app.menuKeyPress = menuKeyPress;
        app.registerThemeChangedCallback = registerThemeChangedCallback;
        app.setViewAnimation = setViewAnimation;
        app.showMenu = showMenu;
        app.themeChanged = themeChanged;
        app.toggleMenu = toggleMenu;
        app.viewTransitionChanged = viewTransitionChanged;
        app.viewStyleChanged = viewStyleChanged;
        activate();

        function activate()
        {          
            // Services (make services globally avilable via app)
            app.config = config;
            app.util = util;
            app.ThemeService = ThemeService;
            app.GameService = GameService;
            app.styler = styler;
            app.CarouselService = CarouselService;

            // app global data
            app.menu = {};
            app.menu.main = [
                {text: 'UI SETTINGS',        type: 'menu', action: 'menu/menu-ui.html'},
                {text: 'OTHER SETTINGS',    type: 'menu', action: 'menu/menu-other.html'},
                {text: 'HELPBAR SETTINGS', type: 'menu', action: 'menu/menu-helpbar.html'},
            ];

            app.menu.history = [];

            config.init();
        }

        function dateFormatChanged()
        {
            config.save('DateFormat', config.app.DateFormat, 'string', config.APP);
        }

        function exitMenu()
        {
            if (app.menu.history.length < 1)
            {
                app.hideMenu();
            }
            else
            {
                app.menu.template = app.menu.history[app.menu.history.length-1];
                app.menu.history.length--;
            }
        }

        function formatDate(text, format)
        {
            if (!format)
            {
                format = config.app.DateFormat || 'dd/mm/yyyy';
            }
            return format
                      .replace(/yyyy/i, text.substring(0,4))
                      .replace(/mm/i,    text.substring(4,6))
                      .replace(/dd/i,    text.substring(6,8)) 
                      .replace(/hh/i,    text.substring(9,11)) 
                      .replace(/mi/i,    text.substring(11,13)) 
                      .replace(/ss/i,    text.substring(13,15));
        }

        function goMenu(template)
        {
            app.menu.history.push(app.menu.template);
            app.menu.template = template;
        }

        function hideMenu()
        {
            app.show_menu = false;
            app.menu.history.length = 0;
            util.defaultFocus();
        }

        function languageChanged()
        {
            config.save('Language', config.app.Language, 'string', config.APP);
            config.load(LANG, config.app.Language, true)
            .then(function() {
                GameService.setFieldText();
                hideMenu();
            });
        }

        function menuKeyPress($event)
        {
            if ($event.keyCode == 27)  // Escape
            {
                exitMenu();
            }
        }

        function registerThemeChangedCallback(callback)
        {
            app.themeChangedCallback = callback;
        }

        function setViewAnimation(anim_class)
        {
            var view_el = angular.element(document.querySelector('#mainview'));
            var classes = ['fade','slideleft','slideright','slideup','slidedown'];
            angular.forEach(classes, function(c) {
                if (c != anim_class )
                {
                    view_el.removeClass(c);
                    //view_el.removeClass(c+'.ng-enter');
                    //view_el.removeClass(c+'.ng-leave');
                }
            });
            if (anim_class)
            {
                app.animate_view_class = anim_class;
                view_el.addClass(anim_class);
                //view_el.addClass('anim_class.ng-enter');
                //view_el.addClass('anim_class.ng-leave');
                
            }
            else
            {
                app.animate_view_class = '';                  
            }
        }

        function showMenu()
        {
            app.menu.template = 'menu/menu-main.html';
            app.menu.history.length = 0;
            app.show_menu = true;
        }

        function toggleMenu()
        {
            if (!app.show_menu)
            {
                showMenu();
            }
            else
            {
                hideMenu();
            }
        }

        function themeChanged(theme)
        {
            if (theme)
            {
                config.app.ThemeSet = theme;
                config.themehover = false;
            }
            else
            {
                hideMenu();
            }
            config.save('ThemeSet', config.app.ThemeSet, 'string', config.APP);

            ThemeService.getTheme(config.app.ThemeSet, ThemeService.system.name, ThemeService.view.name)
            .then(function()
            {
                // choose best view
                GameService.checkSystemTheme(ThemeService.system.name, true);
                util.defaultFocus();

                if (app.themeChangedCallback)
                {
                    app.themeChangedCallback();
                }
            });
        }

        function viewTransitionChanged()
        {
            config.save('ViewTransitions', config.app.ViewTransitions, 'string', config.APP);
            ThemeService.setCurrentSystem();
            util.defaultFocus();
        }

        function viewStyleChanged()
        {
            ThemeService.switchView(config.app.ViewStyle);
            config.save('ViewStyle', config.app.ViewStyle, 'string', config.APP);
            util.defaultFocus();
        }
    }

})();

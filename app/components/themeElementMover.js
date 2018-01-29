/**
 * themeElement.js
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.components')
        .directive('themeElementMover', themeElementMover);

    function themeElementMover() {
        var directive = {
            restrict: 'E',
            replace: true,
            template: '<div class="element-mover"'+
                          ' ng-show="vm.element" '+
                          ' ng-style="vm.moverStyle">'+
                          '{{vm.element.name}}'+
                      '</div>',
            controller: controller,
            controllerAs: 'vm'
        }
        return directive;
    }

    controller.$inject = ['$scope','$element','$document','$window','util','ThemerService'];

    function controller($scope, $element, $document, $window, util, ThemerService)
    {
        var vm = this;
        var startX, startY, startW, startH;
        var initialMouseX, initialMouseY;
        var size, hasWidth, hasHeight;
        var moveX, moveY, resizeNorth, resizeSouth, resizeWest, resizeEast;

        //vm.$onDestroy = onDestroy;
        vm.$onInit = onInit;
        vm.moverStyle = {};  // style or the overlay/hover
        vm.themeStyle; // style of the theme element
/*
        function onDestroy()
        {
            $document.unbind('mousemove', mouseMove);
            $document.unbind('mouseup', mouseUp);
        }
*/
        function onInit()
        {
            ThemerService.moverScope = $scope;

            // watch for mouse over different element
            $scope.$watch(function() { return ThemerService.element; }, elementChanged);

            $document.bind('mousemove', mouseMove);
            $element.bind('mousedown', mouseDown);
        }

        function elementChanged(element)
        {
            vm.element = element;
            if(element)
            {
                vm.themeStyle = element.div || element.style || element.img;
                if (vm.themeStyle)
                {
                    // make overlay size and position the same as the theme element
                    vm.moverStyle.left = vm.themeStyle.left;
                    vm.moverStyle.top = vm.themeStyle.top;
                    vm.moverStyle.width = hasWidth = vm.themeStyle.width || vm.themeStyle['max-width'];
                    vm.moverStyle.height = hasHeight = vm.themeStyle.height || vm.themeStyle['max-height'];
                    if (element.name == 'background')
                    {
                        vm.moverStyle['z-index'] = vm.themeStyle['z-index'];
                    }
                    else
                    {
                        vm.moverStyle['z-index'] = vm.themeStyle['z-index'] + 100;
                    }
                    vm.moverStyle.transform = vm.themeStyle.transform;
                }
            }
        }

        function mouseDown($event)
        {
            // rememeber state when clicked
            ThemerService.mouseDown = true;
            startX = $element.prop('offsetLeft');
            startY = $element.prop('offsetTop');
            startW = $element.prop('offsetWidth');
            startH = $element.prop('offsetHeight');
            initialMouseX = $event.clientX;
            initialMouseY = $event.clientY;
            $document.bind('mouseup', mouseUp);
            return false;
        }

        function mouseMove($event)
        {
            var dx = $event.clientX - initialMouseX;
            var dy = $event.clientY -  initialMouseY;
            var top, left, width, height;

            if (!ThemerService.mouseDown)
            {
                // cursor near to edges ?
                resizeNorth = $event.offsetY < 5;
                resizeSouth = $event.target.offsetHeight - $event.offsetY < 8;
                resizeWest  = $event.offsetX < 5;
                resizeEast  = $event.target.offsetWidth - $event.offsetX < 8;
                // also move position when resizing left and top edges
                moveX = resizeWest;
                moveY = resizeNorth;

                // when cursor is near both edges, dont resize both : just move
                if (resizeNorth && resizeSouth)
                {
                    resizeNorth = resizeSouth = false;
                }
                if (resizeWest && resizeEast)
                {
                    resizeWest = resizeEast = false;
                }

                // set the right cursor depending on resize
                if (resizeNorth && resizeWest && hasWidth && hasHeight)
                {
                    vm.moverStyle.cursor = 'nwse-resize';
                }
                else if (resizeSouth && resizeEast && hasWidth && hasHeight)
                {
                    vm.moverStyle.cursor = 'nwse-resize';
                }
                else if (resizeSouth && resizeWest && hasWidth && hasHeight)
                {
                    vm.moverStyle.cursor = 'nesw-resize';
                }
                else if (resizeNorth && resizeEast && hasWidth && hasHeight)
                {
                    vm.moverStyle.cursor = 'nesw-resize';
                }
                else if (resizeNorth && hasHeight)
                {
                    vm.moverStyle.cursor = 'ns-resize';
                }
                else if (resizeSouth && hasHeight)
                {
                    vm.moverStyle.cursor = 'ns-resize';
                }
                else if (resizeWest && hasWidth)
                {
                    vm.moverStyle.cursor = 'ew-resize';
                }
                else if (resizeEast && hasWidth)
                {
                    vm.moverStyle.cursor = 'ew-resize';
                }
                else
                {
                    vm.moverStyle.cursor = 'move';
                    moveX = moveY = true;
                }
            }

            if (ThemerService.mouseDown)
            {
                // Vertical resize
                if (hasHeight && (resizeNorth || resizeSouth))
                {
                    // calc new height
                    height = util.round((startH +
                                        (resizeNorth ? -1 : 1) *  // negative delta
                                        (vm.element.origin && vm.element.origin.h ? 2 : 1) * // resizing both sides
                                         dy) / $window.innerHeight, 4);
                    // don't invert resize
                    if (height > 0)
                    {
                        vm.moverStyle.height = util.pct(height, 'vh');
                        if (vm.element.size)
                        {
                            vm.themeStyle.height = vm.moverStyle.height;
                            vm.element.size.h = height;
                        }
                        else if (vm.element.maxSize)
                        {
                            vm.themeStyle['max-height'] = vm.moverStyle.height;
                            vm.element.maxSize.h = height;
                        }
                    }
                }

                // Horizontal resize
                if (hasWidth && (resizeWest || resizeEast))
                {
                    // calc new width
                    width = util.round((startW +
                                        (resizeWest ? -1 : 1) *  // negative delta
                                        (vm.element.origin && vm.element.origin.w ? 2 : 1) * // resizing both sides
                                         dx) / $window.innerWidth, 4);
                    // don't invert resize
                    if (width > 0)
                    {
                        vm.moverStyle.width = util.pct(width, 'vw');
                        if (vm.element.size)
                        {
                            vm.themeStyle.width = vm.moverStyle.width;
                            vm.element.size.w = width;
                        }
                        else if (vm.element.maxSize)
                        {
                            vm.themeStyle['max-width'] = vm.moverStyle.width;
                            vm.element.maxSize.w = width;
                        }
                    }
                }

                // Horizontal move
                if (moveX)
                {
                    left = util.round((startX + dx) / $window.innerWidth, 4);
                    vm.themeStyle.left =
                     vm.moverStyle.left = util.pct(left, 'vw');
                    vm.element.pos.x = left;
                }

                // Vertical move
                if (moveY)
                {
                    top = util.round((startY + dy) / $window.innerHeight, 4);
                    vm.themeStyle.top =
                     vm.moverStyle.top = util.pct(top, 'vh');
                    vm.element.pos.y = top;
                }
            }
            $scope.$evalAsync();
            return false;
        }

        function mouseUp()
        {
            ThemerService.mouseDown = false;
            $document.unbind('mouseup', mouseUp);
        }
    }

})();

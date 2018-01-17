/**
 * style.service.js
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.styler_service', [])
        .service('styler', styler);

    styler.$inject = ['config','util','$document'];
        
    function styler(config, util, $document)
    {
        var self = this;

        // arrays for dynamically loaded content
        self.fonts = {};
        self.audio = {};
        self.class = {}; // dynamic classes for logo transitions

        self.defaultLineSpacing = 1.5;
        self.defaultCarousel = {
            systemcarousel: {
                name: 'systemcarousel',
                type: 'horizontal',  // anything other than 'vertical' is horiczontal
                pos:  {x: 0, y: 0.383},
                size: {w: 1, h: 0.232},
                color: '#FFFFFFD8',
                maxLogoCount: 3,
                logoScale: 1.4,
                logoSize: {w: 0.24, h: 0.14},
                fontSize: 0.16,
                zIndex: 40
            },
            systemInfo: {
                name: 'systemInfo',
                pos:  {x: 0, y: 0.615},
                size: {w: 1, h: 0.063},
                backgroundColor: '#DCDCDCD8',
                color: '#555',
                alignment: 'center',
                fontSize: 0.04,
                lineSpacing: 1,
                zIndex: 50
            }
        };

        // public functions
        self.calcObjBounds = calcObjBounds;
        self.changeCarousel = changeCarousel;
        self.createCarouselStyle = createCarouselStyle;
        self.createCarsouselClasses = createCarsouselClasses;
        self.createImageStyle = createImageStyle;
        self.createTextStyle = createTextStyle;
        self.createRatingStyle = createRatingStyle;
        self.createVideoStyle = createVideoStyle;
        self.createViewStyles = createViewStyles;
        self.denormalize = denormalize;
        self.fullpath = fullpath;
        self.fullImagePaths = fullImagePaths;
        self.getAudioId = getAudioId;
        self.insertIntoView = insertIntoView;
        self.loadAudio = loadAudio;
        self.loadFontFamily = loadFontFamily;
        self.loadFonts = loadFonts;
        self.loadMedia = loadMedia;
        self.loadSounds = loadSounds;
        self.objectReposition = objectReposition;
        self.setHelpbarStyle = setHelpbarStyle;
        self.setSystemImagesContainerStyle = setSystemImagesContainerStyle;
        self.setSystemLogoStyle = setSystemLogoStyle;
        self.xReposition = xReposition;

        function calcObjBounds(obj)
        {
            // not a thing we can move
            if (!obj.pos)
            {
                return;
            }
            var size = obj.size || obj.maxSize;
            if(!size || size.w==1 || !size.h)
            {
                return;
            }
            obj.top = obj.pos.y
            obj.left = obj.pos.x
            obj.bottom = obj.pos.y + size.h;
            obj.right = obj.pos.x + size.w;
            if (obj.origin)
            {
                obj.top -= size.h * obj.origin.y;
                obj.left -= size.w * obj.origin.x;
                obj.bottom -= size.h * obj.origin.y;
                obj.right -= size.w * obj.origin.x;
            }
        }

        // alter attributes (while dragging) of each logo and images container
        function changeCarousel(pct)
        {
            angular.forEach(self.carousel.logos, function(cell) {
                setSystemLogoStyle(cell, pct)
            });
            angular.forEach(self.carousel.backgrounds, function(cell) {
                setSystemImagesContainerStyle(cell, pct)
            });
        }

        function createCarouselStyle(carousel)
        {
            // alredy done?
            if (!carousel || (typeof carousel) != 'object' || carousel.styled)
            {
                createCarsouselClasses(carousel);
                return;
            }

            if (config.app.LogThemeStyles)
            {
                console.groupCollapsed('styler.createCarouselStyle('+carousel.name+')');
            }

            if (!carousel.type)
            {
                carousel.type = 'horizontal';
            }

            var style = {};

            if (carousel.pos)
            {
                carousel.pos = denormalize('pos',carousel.pos);
            }
            else
            {
                carousel.pos = self.defaultCarousel.systemcarousel.pos;
            }
            style.left = util.pct(carousel.pos.x,'vw');
            style.top = util.pct(carousel.pos.y,'vh');

            if (carousel.size)
            {
                carousel.size = denormalize('size',carousel.size);
            }
            else
            {
                carousel.size = self.defaultCarousel.systemcarousel.size;
            }
            if (carousel.size.w)
            {
                style.width = util.pct(carousel.size.w,'vw');
            }
            if (carousel.size.h)
            {
                style.height = util.pct(carousel.size.h,'vh');
            }

            if (carousel.maxLogoCount)
            {
                carousel.maxLogoCount = parseFloat(carousel.maxLogoCount);
            }
            else
            {
                carousel.maxLogoCount = 3;
            }

            if (carousel.logoScale)
            {
                carousel.logoScale = parseFloat(carousel.logoScale);
            }
            else
            {
                carousel.logoScale = self.defaultCarousel.systemcarousel.logoScale;
            }


            carousel.midX = carousel.pos.x + carousel.size.w / 2;
            carousel.midY = carousel.pos.y + carousel.size.h / 2;

            if (carousel.logoSize)
            {
                carousel.logoSize = denormalize('size',carousel.logoSize);
            }
            else
            {
                if (carousel.size == self.defaultCarousel.systemcarousel.size)
                {
                    carousel.logoSize =  self.defaultCarousel.systemcarousel.logoSize;
                }
                else
                {
                    carousel.logoSize = {h: 0.9 * carousel.size.h / ( carousel.logoScale * carousel.maxLogoCount ),
                                                w: 0.9 * carousel.size.w / carousel.logoScale };
                }
            }

            if (!carousel.color)
            {
                carousel.color = self.defaultCarousel.systemcarousel.color;
            }

            if (carousel.zIndex)
            {
                carousel.zIndex = parseInt(carousel.zIndex);
            }
            else
            {
                carousel.zIndex = self.defaultCarousel.systemcarousel.zIndex;
            }

            if (!carousel.fontSize)
            {
                carousel.fontSize = self.defaultCarousel.systemcarousel.fontSize;
            }

            if (carousel.logoRotationOrigin)
            {
                carousel.logoRotationOrigin = denormalize('pos',carousel.logoRotationOrigin);
            }

            style['background-color'] = util.hex2rgba(carousel.color);
            style['color'] =  '#222';
            style['z-index'] = carousel.zIndex;


            carousel.div = style;

            if (carousel.type == 'vertical')
            {
                carousel.logo_vw = carousel.size.w;
                carousel.logo_vh = carousel.size.h / carousel.maxLogoCount;
            }
            else if (carousel.type == 'vertical_wheel')
            {
                carousel.logo_vw = carousel.logoSize.w;
                carousel.logo_vh = carousel.logoSize.h;
            }
            else
            {
                carousel.logo_vw = carousel.size.w / carousel.maxLogoCount;
                carousel.logo_vh = carousel.size.h;
            }

            createCarsouselClasses(carousel);

            if (config.app.LogThemeStyles)
            {
                console.groupEnd('styler.createCarouselStyle('+carousel.name+')');
            }

            carousel.styled = true;
        }

        function createCarsouselClasses(carousel)
        {
            self.carousel = carousel;
            carousel.logos = [];
            carousel.backgrounds = [];
            var range = Math.floor(carousel.maxLogoCount/2)+2;
            carousel.loIndex = -range;
            carousel.hiIndex = range;
            // create container attributes for each logo
            // and classes that can be animated
            for (var index = carousel.loIndex; index <= carousel.hiIndex; index++)
            {
                var cell = {index: index};

                var temp_cell = angular.copy(cell);
                setSystemLogoStyle(temp_cell, 0);  // 0 is the resting position (i.e. not dragged)
                createClass('logo'+index, temp_cell)

                carousel.logos.push(cell);
            }

            // create previous, current and next background images container attributes
            // and classes that can be animated
            for (var index = carousel.loIndex; index <= carousel.hiIndex; index++)
            {
                var cell = {index: index};

                var temp_cell = angular.copy(cell);
                setSystemImagesContainerStyle(temp_cell, 0);
                createClass('system_images'+index, temp_cell)

                carousel.backgrounds.push(cell);
            }
        }

        // convert attirbutes container into a css class for animation
        function createClass(className, style_array)
        {
            var style;

            if (config.app.LogThemeStyles)
            {
                console.groupCollapsed('styler.createClass('+className+')');
            }
            if (self.class[className])
            {
                style = self.class[className];
                style.parentNode.removeChild(style);
                //document.removeChild();
            }
            style = document.createElement('style');
            style.type = 'text/css';
            
            // create the class string
            var str = '.'+className+' { '
            angular.forEach(style_array, function(value, key) {
                if (key != 'index')
                {
                    str += key + ': ' + value + ';';
                }
            })
            str += ' }';

            style.innerHTML = str;

            document.getElementsByTagName('head')[0].appendChild(style);

            if (config.app.LogThemeStyles)
            {
                console.log(style);
                console.groupEnd('styler.createClass('+className+')');
            }

            self.class[className] = style; // save for later removal
        }

        function createDatetimeStyle(text)
        {
            createTextStyle(text);

            if (text.name == 'md_lastplayed')
            {
                text.format = 'ago';
            }
            //delete text.div.height;
        }

        // convert theme image attributes to style
        function createImageStyle(image)
        {
            // skip non image
            if (!image || (typeof image) != 'object' || !image.name || image.styled)
            {
                return; // continue
            }

            if (config.app.LogThemeStyles)
            {
                console.groupCollapsed('styler.createImageStyle('+image.name+')');
                angular.forEach(image, function(value, key) {
                    console.log(key + ' = ' + value);
                });
            }

            var style = {}
            style['position'] = 'absolute';

            if (image.name=='background')
            {
                image.fullscreen = true;
                if (!image.pos)
                {
                    image.size = '0 0';
                }
                if (!image.size)
                {
                    image.size = '1 1';
                }
            }

            if (image.pos)
            {
                image.pos = denormalize('pos',image.pos);
                if (image.pos.x>=1 || image.pos.y>=1 ||
                     image.pos.x<0 || image.pos.y<0)
                {
                    style.display = 'none';
                    if (config.app.LogThemeStyles)
                    {
                        console.log('Offscreen - hidden');
                        console.groupEnd('styler.createImageStyle('+image.name+')');
                    }
                    return;
                }
                style.left = util.pct(image.pos.x,'vw');
                style.top = util.pct(image.pos.y,'vh');
            }

            if (image.size)
            {
                image.size = denormalize('size',image.size);
                if(image.size.w)
                {
                    style.width = util.pct(image.size.w,'vw');
                }
                if(image.size.h)
                {
                    style.height = util.pct(image.size.h,'vh');
                }

                if (image.size.w >=1 && image.size.h >=1)
                {
                    image.fullscreen = true;
                }
                else if (image.size.w >=1 || image.size.h >=1)
                {
                    image.banner = true;
                }
            }

            if (image.name == 'md_image' || image.name == 'md_marquee')
            {
                if (!image.origin)
                {
                    image.origin = '0.5 0.5';
                }
            }

            if (image.origin)
            {
                image.origin = denormalize('pos',image.origin);
                if (image.origin.x!=0 || image.origin.y!=0)
                {
                    style['-webkit-transform'] =
                    style['-ms-transform'] =
                    style.transform = 'translate('+
                                                util.pct(-image.origin.x,'%')+','+
                                                util.pct(-image.origin.y,'%')+')';
                }
            }

            if (image.maxSize)
            {
                image.maxSize = denormalize('size',image.maxSize);
                if (image.maxSize.w)
                {
                    style['max-width'] = util.pct(image.maxSize.w,'vw');
                }
                if (image.maxSize.h)
                {
                    style['max-height'] = util.pct(image.maxSize.h,'vh');
                }
            }

            calcObjBounds(image);

            // image file - not just a color
            if (image.fullpath ||
                   (image.name == 'md_image' ||
                    image.name == 'md_marquee' ||
                    image.name == 'background'))
            {
                if ( image.color )
                {
                    image.color = image.color.toLowerCase();
                }

                if ( image.color &&
                      image.color != 'ffffff' &&
                      image.color != 'ffffffff' )
                {
                    var hsl = util.rgbToHSL(image.color);

                    // if greyscale color image client side
                    if(hsl.h == 0 && hsl.s == 0 && hsl.l > 0.5)  // light
                    {
                        style.filter = 'brightness('+util.pct(hsl.l,'%')+')';
                        if (hsl.a || hsl.a === 0)
                        {
                            style.filter += ' opacity('+util.pct(hsl.a,'%')+')';
                        }
                    }
                    else if(hsl.h == 0 && hsl.s == 0)  // dark
                    {
                        style.filter = 'invert(100%) saturate(0%)'; // contrast(100%)';
                        style.filter += ' contrast('+util.pct(1-hsl.l,'%')+')';
                        if (hsl.a || hsl.a === 0)
                        {
                            style.filter += ' opacity('+util.pct(hsl.a,'%')+')';
                        }
                    }
                    // color image server side if it's a svg or if php has gd2 library enabled
                    else
                    if (image.fullpath && (image.type=='svg' || ( config.env.has_gd &&
                             (image.type=='png' || image.type=='jpg' || image.type=='gif')
                          )))
                    {
                        image.fullpath = 'svr/color_img.php?file='+
                                                     image.fullpath.substring(4)+ // remove svr/
                                                     '&color='+image.color; //+'&mult=1';
                    }
                    // and if we don't have php_gd loaded ...
                    // try to taint image to color specified using filters client side (poor)
                    else
                    {
                        // speia is yellow (+60 degrees) so rotate -60 degrees
                        style.filter = 'sepia(100%) saturate(5000%) hue-rotate('+((hsl.h-60)%360)+'deg)';
                        if (hsl.a)
                        {
                            style.filter += ' opacity('+util.pct(hsl.a,'%')+')';
                        }
                    }
                }

                // div background tiled
                if (image.fullpath && image.tile == 'true')
                {
                    style['background-image'] = 'url("'+image.fullpath+'")';
                    style['background-repeat'] = 'repeat';
                }
                // div background fullscreen
                else if (image.fullpath && image.fullscreen)
                {
                    style['background-image'] = 'url("'+image.fullpath+'")';
                    style['background-size'] = '100% 100%';
                    style.width = '100vw';
                    style.height = '100vh';
                }
                // stretch/shrink FIT keeping aspect ratio (uses background-size: contain)
                else if (style['max-width'] && style['max-height'] && image.right <= 1)
                {
                    if (image.fullpath)
                    {
                        style['background-image'] = 'url("'+image.fullpath+'")';
                    }
                    style['background-size'] = 'contain';
                    style['background-repeat'] = 'no-repeat';

                    var bp_h = 'center';
                    var bp_v = 'center';
                    if (image.origin)
                    {
                        if (image.origin.x == 0)
                        {
                            bp_h = 'left';
                        }
                        else if (image.origin.x == 1)
                        {
                            bp_h = 'right';
                        }
                        if (image.origin.y == 0)
                        {
                            bp_v = 'top';
                        }
                        else if (image.origin.y == 1)
                        {
                            bp_v = 'bottom';
                        }
                    }
                    style['background-position'] = bp_h + ' ' + bp_v;

                    style.width = style['max-width'];
                    style.height = style['max-height'];
                    delete style['max-width'];
                    delete style['max-height'];
                }
                // img src/content
                else
                {
                    if (image.fullpath)
                    {
                        //style.content = 'url("'+image.fullpath+'")';
                        image.img_src = image.fullpath;
                    }

                    // if theme has height 100% only and variable width make the width 100% anyway
                    // i.e. stretch so no black left/right borders but aspect ratio will be wrong
                    if (image.size && image.size.h==1)     // sorry themers!
                    {
                        //style.width = '100vw';
                        style.width = '100%';
                    }
                }
            }
            // image is just a color with no image so just set background color
            else if (image.color)
            {
                style['background-color'] = util.hex2rgba(image.color);
            }

            // no longer needed
            delete image.path;
            delete image.color;
            //delete image.index;

            // depending on the sizing method or tiling etc
            // we either style just a div or an image within a div
            if (style['background-image'] ||
                style['background-color'] ||
                style['background-size'])
            {
                image.div = style;
            }
            else
            {
                image.img = style;
            }

            if (image.zIndex)
            {
                style['z-index'] = parseInt(image.zIndex);
            }
            else if (image.name == 'background')
            {
                style['z-index'] = 1;
            }
            else if(image.extra)
            {
                style['z-index'] = 10;
            }
            else if (image.name == 'md_image')
            {
                style['z-index'] = 30;
            }
            else if (image.name == 'md_video')
            {
                style['z-index'] = 30;
            }
            else if (image.name == 'md_marquee')
            {
                style['z-index'] = 35;
            }
            else if (image.name == 'logo')
            {
                style['z-index'] = 50;
            }
            else 
            {
                style['z-index'] = image.index;
            }

            image.styled = true;
            if (config.app.LogThemeStyles)
            {
                console.log(style);
                console.groupEnd('styler.createImageStyle('+image.name+')');
            }
         }


        // set up position, background / foregrund stars
        function createRatingStyle(rating)
        {
            if(!rating || (typeof rating) != 'object' || rating.styled)
            {
                return;
            }

            if (config.app.LogThemeStyles)
            {
                console.groupCollapsed('styler.createRatingStyle('+rating.name+')');
                angular.forEach(rating, function(value, key) {
                    console.log(key + ' = ' + value);
                });
            }

            var style = {position: 'absolute'}
            var stars = {}

            rating.pos = denormalize('pos',rating.pos);
            if (!rating.pos)
            {
                rating.anchor_label = true;
                style.display = 'none';
            }
            else if (rating.pos.x>=1 || rating.pos.y>=1)
            {
                style.display = 'none';
            }
            else
            {
                style.left = util.pct(rating.pos.x,'vw');
                style.top = util.pct(rating.pos.y,'vh');

                if (rating.size)
                {
                    rating.size = denormalize('size',rating.size);
                    var pct;

                    // theme should only have w or h not both
                    if (rating.size.h)
                    {
                        rating.size.w = rating.size.h * 5;
                        pct = 'vh';
                    }
                    else if (rating.size.w)
                    {
                        rating.size.h = rating.size.w / 5;
                        pct = 'vw';
                    }

                    if (rating.size.h)
                    {
                        style.height = (100*rating.size.h) + pct;
                    }
                    if (rating.size.w)
                    {
                        style.width = (100*rating.size.w) + pct;
                    }
                }
                if (rating.fullunfilledPath)
                {
                    style['background-image'] = 'url("' + rating.fullunfilledPath + '")';
                }
                if (rating.fullfilledPath)
                {
                    // make the stars gold, hopefully not annoy theme designers
                    stars['background-image'] = 'url("svr/color_img.php?file='+ // make it gold
                              rating.fullfilledPath.substring(4) + '&color=FFD400")';
                    // original colour would be :-
                    //stars['background-image'] = 'url("' + rating.fullfilledPath + '")';
                }

                if (rating.zIndex)
                {
                    style['z-index'] = parseInt(rating.zIndex)+1;
                }
                else if (rating.name && rating.name.substring(0,3)=='md_')
                {
                    style['z-index'] = 30;
                }
                else
                {
                    style['z-index'] = rating.index;
                }
            }
            calcObjBounds(rating);
            rating.div = style;
            rating.stars = stars;
            rating.styled = true;

            if (config.app.LogThemeStyles)
            {
                console.log(style);
                console.log(stars);
                console.groupEnd('styler.createRatingStyle('+rating.name+')');
            }
        }

        // convert theme text attributes to style
        function createTextStyle(text)
        {
            if (!text || (typeof text) != 'object' || text.styled)
            {
                return;
            }

            if (config.app.LogThemeStyles)
            {
                console.groupCollapsed('styler.createTextStyle('+text.name+')');
                angular.forEach(text, function(value, key) {
                    console.log(key + ' = ' + value);
                });
            }

            text.div = {};
            text.style = {};

            if (text.fontSize)
            {
                text.fontSize = util.round(text.fontSize,6);
            }
            else
            {
                text.fontSize = 0.035;
            }

            if (text.name == "help")
            {
                if (!text.textColor)
                {
                    text.textColor = '777777';
                }
                if (!text.iconColor)
                {
                    text.iconColor = '777777';
                }
                text.div.color = '#'+text.textColor.substring(0,6);
            }
            else if (text.anchor_label)
            {
                text.div.left = '100%';
                text.div.top = '0';
                text.style['margin-left'] = util.pct(text.fontSize * 0.75,'vmin');
                if (!text.fontFamily)
                {
                    text.div['font-family'] = 'ohc_regular';
                }
            }
            else if (!text.pos)
            {
                text.div.display = 'none';
                if (config.app.LogThemeStyles)
                {
                    console.log('no position - hidden');
                    console.groupEnd('styler.createTextStyle('+text.name+')');
                }
                return;
            }

            if (text.pos)
            {
                text.pos = denormalize('pos',text.pos);

                if (text.pos.x>=1 || text.pos.y>=1 ||
                     text.pos.x<0 || text.pos.y<0)
                {
                    text.div.display = 'none';
                    if (config.app.LogThemeStyles)
                    {
                        console.log('Offscreen - hidden');
                        console.groupEnd('styler.createTextStyle('+text.name+')');
                    }
                    return;
                }

                text.div.left = util.pct(text.pos.x,'vw');
                text.div.top = util.pct(text.pos.y,'vh');
            }

            // default size for helpsystembar
            if (text.name == "help" && !text.size)
            {
                text.size = {w: text.pos
                                     ? 1 - text.pos.x  // to right edge
                                     : 1,                  // full width
                                 h: text.fontSize
                                     ? text.fontSize + 0.01  // padding 
                                     : 0.045};
            }
            else if (text.size)
            {
                text.size = denormalize('size',text.size);

                // don't allow gamelist off screen, I'm looking at you 'clean-look' theme
                if (text.name == 'gamelist' && text.pos.x + text.size.w > 0.995)
                {
                    text.size.w = 0.995 - text.pos.x;
                }
            }

            if (!text.lineSpacing)
            {
                text.lineSpacing = self.defaultLineSpacing;
            }
            else
            {
                text.lineSpacing = util.round(text.lineSpacing * 1.03, 4);
            }

            calcObjBounds(text);

            if (text.name == 'md_description')
            {
                text.multiline = true;
            }

            if (text.size)
            {
                if (text.size.w)
                {
                    text.div['max-width'] =
                    text.div.width = util.pct(text.size.w,'vw');
                }
                if (text.size.h)
                {
                    text.div.height = util.pct(text.size.h,'vh');
                }
                text.style.width = text.div.width;
            }

            var height = text.fontSize * self.defaultLineSpacing; // text.lineSpacing
            if (text.size && text.size.h)
            {
                height = text.size.h;
            }

            text.div.height = util.pct(height,'vh');

            text.style['font-size'] = util.pct(text.fontSize,'vh');

            text.rows = Math.floor(height / text.fontSize) || 1;
            if (text.multiline && text.lineSpacing)
            {
                if (text.name != 'gamelist')
                {
                    text.style['line-height'] = text.lineSpacing;
                }
            }


            if (text.color)
            {
                text.style['color'] = util.hex2rgba(text.color);
            }

            if (text.backgroundColor)
            {
                text.div['background-color'] = util.hex2rgba(text.backgroundColor);
            }

            if (text.fontFamily)
            {
                text.style['font-family'] = text.fontFamily;
                text.div['font-family'] = text.fontFamily;
                if (!text.multiline)
                {
                    var vcenter = self.fonts[text.fontFamily].vcenter || -50;
                    text.style['top'] = '50%';
                    text.style['-webkit-transform'] = 'translateY('+vcenter+'%)';
                    text.style['-ms-transform'] = 'translateY('+vcenter+'%)';
                    text.style['transform'] = 'translateY('+vcenter+'%)';
                }
            }

            if (parseInt(text.forceUppercase))
            {
                text.style['text-transform'] = 'uppercase';
                text.div['text-transform'] = 'uppercase';
            }

            if (text.alignment)
            {
                text.div['text-align'] = text.alignment;
            }

            if (text.zIndex) // && parseInt(text.zIndex)>=0)
            {
                text.div['z-index'] = parseInt(text.zIndex)+1;
            }
            else if (text.name && text.name.substring(0,3)=='md_')
            {
                text.div['z-index'] = 40;
            }

            text.styled = true;

            if (config.app.LogThemeStyles)
            {
                console.log(text.div);
                console.log(text.style);
                console.groupEnd('styler.createTextStyle('+text.name+')');
            }
        }

        function createTextlistStyle(textlist)
        {
            createTextStyle(textlist);
            textlist.selectorOffsetY = parseFloat(textlist.selectorOffsetY || 0);
            textlist.fontSize        = parseFloat(textlist.fontSize);
            textlist.selectorHeight  = parseFloat(textlist.selectorHeight);
            textlist.lineSpacing     = parseFloat(textlist.lineSpacing);

            if (textlist.fullselectorImagePath)
            {
                textlist.selector = {
                     'background-image': 'url("'+textlist.fullselectorImagePath+'")',
                     'height': util.pct(textlist.selectorHeight,'vh'),
                     'width': util.pct(textlist.size.w,'vw')
                }
            }
        }

        function createVideoStyle(video)
        {
            if (!video || (typeof video) != 'object' || video.styled)
            {
                return;
            }

            if (config.app.LogThemeStyles)
            {
                console.groupCollapsed('styler.createVideoStyle('+video.name+')');
                angular.forEach(video, function(value, key) {
                    console.log(key + ' = ' + value);
                });
            }

            var style = {};

            if (!video.pos)
            {
                video.pos='1 1';
            }

            if (video.pos)
            {
                video.pos = denormalize('pos',video.pos);
                if (video.pos.x>=1 || video.pos.y>=1 ||
                    video.pos.x<0 || video.pos.y<0)
                {
                    style.display = 'none';
                    if (config.app.LogThemeStyles)
                    {
                        console.log('Offscreen - hidden');
                        console.groupEnd('styler.createVideoStyle('+video.name+')');
                    }
                    video.div = style;
                    return;
                }
                style.left = util.pct(video.pos.x,'vw');
                style.top = util.pct(video.pos.y,'vh');
            }

            style['object-fit'] = 'fill';

            if (video.showSnapshotNoVideo == 'true') {
                style['background-size'] = 'contain';
                style['background-repeat'] = 'no-repeat';
            }

            // default video origin center
            if (!video.origin)
            {
                video.origin = '0.5 0.5';
            }

            if (video.origin)
            {
                video.origin = denormalize('pos',video.origin);
                if (video.origin.x!=0 || video.origin.y!=0)
                {
                    style['-webkit-transform'] =
                    style['-ms-transform'] =
                    style.transform = 'translate('+
                                                util.pct(-video.origin.x,'%')+','+
                                                util.pct(-video.origin.y,'%')+')';
                }
            }

            if (video.size)
            {
                video.size = denormalize('size',video.size);
                if (video.size.w)
                {
                    style.width = util.pct(video.size.w,'vw');
                }
                if (video.size.h)
                {
                    style.height = util.pct(video.size.h,'vh');
                }
            }
            if (video.maxSize)
            {
                video.maxSize = denormalize('size',video.maxSize);
                if (video.maxSize.w)
                {
                    style.width =
                    style['max-width'] = util.pct(video.maxSize.w,'vw');
                }
                if (video.maxSize.h)
                {
                    style.height =
                    style['max-height'] = util.pct(video.maxSize.h,'vh');
                }
            }
            var bp_h = 'center';
            var bp_v = 'center';
            if (video.origin)
            {
                if (video.origin.x == 0)
                {
                    bp_h = 'left';
                }
                else if (video.origin.x == 1)
                {
                    bp_h = 'right';
                }
                if (video.origin.y == 0)
                {
                    bp_v = 'top';
                }
                else if (video.origin.y == 1)
                {
                    bp_v = 'bottom';
                }
            }

            style['background-position'] = bp_h + ' ' + bp_v;

            calcObjBounds(video);

            style['position'] = 'absolute';

            if (config.es.VideoOmxPlayer)
            {
                style['z-index'] = 5000;
            }
            else if (video.zIndex)
            {
                style['z-index'] = parseInt(video.zIndex)+1;
            }
            else if (video.name && video.name.substring(0,3)=='md_')
            {
                style['z-index'] = 30;
            }
            else
            {
                style['z-index'] = video.index;
            }

            video.div = style;

            video.styled = true;

            if (config.app.LogThemeStyles)
            {
                console.log(style);
                console.groupEnd('styler.createVideoStyle('+video.name+')');
            }
        }

        // convert theme view object attributes to styles
        function createViewStyles(view, keep_style)
        {
            if (!view)
            {
                return;
            }

            // system carousel update
            if (view.name == 'system' && !keep_style)
            {
                if (!view.carousel)
                {
                    view.carousel = self.defaultCarousel;
                }
                createCarouselStyle(view.carousel.systemcarousel);
                if (!view.text)
                {
                     view.text = {};
                }
                if (!view.text.systemInfo)
                {
                     view.text.systemInfo = self.defaultCarousel.systemInfo;
                }
                createSystemInfoStyle(view.text.systemInfo)
            }

            // already done ?
            if (!view.styled)
            {
                if (config.app.LogThemeStyles)
                {
                    console.groupCollapsed('styler.createViewStyles('+view.name+')');
                }

                angular.forEach(view.text,        createTextStyle);
                angular.forEach(view.textlist,    createTextlistStyle);
                angular.forEach(view.datetime,    createDatetimeStyle);
                angular.forEach(view.image,       createImageStyle);
                angular.forEach(view.rating,      createRatingStyle);
                angular.forEach(view.helpsystem,  createTextStyle);
                angular.forEach(view.video,       createVideoStyle);
                

                // if text or date anchored to label float label left
                if (view.text)
                angular.forEach(config.lang.md_label, function(label_text, md) {
                    var label = view.text['md_lbl_'+md];
                    var text = view.text['md_'+md];
                    if (!text && view.datetime)
                    {
                        text = view.datetime['md_'+md];
                    }
                    if (label && text && text.anchor_label)
                    {
                        label.style.float = 'left';
                    }
                });
                if (config.app.LogThemeStyles)
                {
                    console.groupEnd('styler.createViewStyles('+view.name+')');
                }

                view.styled = true;
            }
        }

        function createSystemInfoStyle(systemInfo)
        {
            ['pos','size','color','backgroundColor','alignment','fontSize','lineSpacing']
            .forEach(function(key) {
                if (!systemInfo[key])
                {
                     systemInfo[key] = self.defaultCarousel.systemInfo[key];
                }
            });
            systemInfo.styled = false;
            createTextStyle(systemInfo);
            self.systemInfo = systemInfo;
        }


        // convert string float pair into object
        // E.g. "0 1" to {x: 0, y: 1}
        function denormalize(type, str)
        {
            if (!str || typeof str != 'string')
            {
                return str;
            }

            if (str.match(/-*[0-9\.][0-9\.]*[, ]+-*[0-9\.][0-9\.]*/))
            {
                var arr = str.split(/[, ]+/);
                if (type=='pos')
                {
                    return { x : parseFloat(arr[0]), y : parseFloat(arr[1])};
                }
                else if (type=='size')
                {
                    return { w : parseFloat(arr[0]), h : parseFloat(arr[1])};
                }
                else
                {
                    return arr;
                }
            }
            else
                return str;
        }

        // translate path relative to file or include file
        // then simplify
        function fullpath(object, field, path)
        {
            if (object[field].substr(0,2) == './')  // strip ./
            {
                object[field] = object[field].slice(2);
            }

            object.type = object[field].slice(-3); // extension
            object['full'+field] = path+'/'+object[field]; // create full path

            // simplify parent/../ to ''  (twice) (.. doesn't play nice in url!)
            object['full'+field] = object['full'+field].replace(/[^\/]*\/\.\.\//, '');
            object['full'+field] = object['full'+field].replace(/[^\/]*\/\.\.\//, '');
        }

        function fullViewImagePaths(view, path, include_count)
        {
            angular.forEach(view.video, function(video)
            {
                if (video.default)
                {
                    fullpath(video, 'default', path);
                }
            });

            angular.forEach(view.image, function(image)
            {
                if (image.name && image.path)
                {
                    fullpath(image, 'path', path);
                    image.include_count = include_count;
                }
            });

            if(view.textlist &&
                view.textlist.gamelist &&
                view.textlist.gamelist.selectorImagePath)
            {
                 fullpath(view.textlist.gamelist, 'selectorImagePath', path);
            }

            // expand paths of rating star images if themed
            if (view.rating && view.rating.md_rating)
            {
                if (view.rating.md_rating.unfilledPath)
                {
                    fullpath(view.rating.md_rating, 'unfilledPath', path);
                }
                if (view.rating.md_rating.filledPath)
                {
                    fullpath(view.rating.md_rating, 'filledPath', path);
                }
            }
        }

        // Store full image path relative to the file it was included in
        // (so that the path doesn't get lost after expansion)
        function fullImagePaths(themefile, path, include_count)
        {
            if (!themefile || !themefile.view)
            {
                return;
            }

            angular.forEach(themefile.view, function(view)
            {
                fullViewImagePaths(view, path, include_count)
            });
        }

        // generate an id from the filename
        function getAudioId(filename, path)
        {
            if (filename)
            {
                if (filename.substr(0,2) == './')
                {
                    filename = filename.slice(2);
                }
                var fullpath = path+'/'+filename;

                fullpath = fullpath
                                  .replace(/[^\/]*\/\.\.\//g, '') // replace parent/../ with ''
                var id = fullpath
                                  .replace(/(\/|-)/g, "_")        // replace /, - with _
                                  .replace(/(\..*|\/)/g, '')     // remove extension
                                  .substring(11);                    // remove 'svr/themes'
                loadAudio(id, fullpath);
                return id;
            }
        }

        // Insert object (column of gamelist) into view
        // but only between top and bottom of gamelist
        function insertIntoView(view, insert_x, width, gamelist_top, gamelist_bottom)
        {
            angular.forEach(view.image, function(image)
            {
                objectReposition(image, insert_x, width, gamelist_top, gamelist_bottom);
            });
            angular.forEach(view.text, function(text)
            {
                objectReposition(text, insert_x, width, gamelist_top, gamelist_bottom);
            });
            angular.forEach(view.datetime, function(text)
            {
                objectReposition(text, insert_x, width, gamelist_top, gamelist_bottom);
            });
            angular.forEach(view.textlist, function(textlist)
            {
                objectReposition(textlist, insert_x, width, gamelist_top, gamelist_bottom);
            });
            angular.forEach(view.rating, function(rating)
            {
                objectReposition(rating, insert_x, width, gamelist_top, gamelist_bottom);
            });
            angular.forEach(view.video, function(video)
            {
                objectReposition(video, insert_x, width, gamelist_top, gamelist_bottom);
            });
/*
            angular.forEach(view.marquee, function(marquee)
            {
                objectReposition(marquee, insert_x, width, gamelist_top, gamelist_bottom);
            });
*/
/*
            if (!self.orig_width)
            {
                self.orig_width = $window.outerWidth;
                self.orig_height = $window.outerHeight;
            }

            // increase the window size,  worth a go but most browser wont comply
            // so the scale will appear to change instead of the window expanding
            //$window.resizeTo($window.innerWidth * ( 1 + width ), $window.innerHeight);
            $window.resizeTo(self.orig_width * ( 1 + width ), self.orig_height);
*/
        }

        // dynamically create audio element and its source,
        // store audio element in an array for later lookup
        function loadAudio(id, filename)
        {
            if (self.audio[id]) // already loaded
            {
                return;
            }

            var audio = document.createElement('audio');
            var source = document.createElement('source');
            source.src=filename;
            audio.appendChild(source);

            self.audio[id] = audio;
        }


        // dynamically load the font face
        function loadFontFamily(text, theme)
        {
            if (self.fonts[text.fontFamily]) // already loaded
            {
                return;
            }

            var font = theme.fonts[text.fontFamily];
            var style_el = $document[0].createElement('style');
            style_el.innerHTML = "@font-face {font-family: '" + text.fontFamily + "';"+
                                          "src: url('" + font.fullpath + "') format('truetype');}";
            $document[0].body.appendChild(style_el);
            font.style_el = style_el;
            self.fonts[text.fontFamily] = font;
        }

        // Store full font path relative to the file it was included in
        // (so that the path doesn't get lost after expansion)
        function loadFonts(theme, themefile, path, type)
        {
            if (!themefile || !themefile.view)
            {
                return;
            }

            angular.forEach(themefile.view, function(view)
            {
              angular.forEach(view[type], function(text)
              {
                  if (text.name && text.fontFamily)
                  {
                      loadFontFamily(text, theme);
                  }
              });
              if (view.helpsystem && view.helpsystem.help.fontFamily)
              {
                  loadFontFamily(view.helpsystem.help, theme);
              }
              if (view.carousel)
              {
                  if (view.carousel.systemcarousel &&
                        view.carousel.systemcarousel.fontFamily)
                  {
                      loadFontFamily(view.carousel.systemcarousel, theme);
                  }
                  if (view.carousel.systemInfo &&
                        view.carousel.systemInfo.fontFamily)
                  {
                      loadFontFamily(view.carousel.systemInfo, theme);
                  }
              }
            });
        }

        function loadMedia(theme, node, path, include_count)
        {
            fullImagePaths(node, path, include_count);
            loadFonts(theme, node, path, 'text');
            loadFonts(theme, node, path, 'textlist');
            loadFonts(theme, node, path, 'datetime');
            loadFonts(theme, node, path, 'helpsystem');
            loadSounds(node, path);
        }

        // dynamically load all sounds
        function loadSounds(themefile, path)
        {
            if (!themefile || !themefile.view)
            {
                return;
            }
            angular.forEach(themefile.view, function(view)
            {
                if (view.textlist)
                {
                    angular.forEach(view.textlist, function(textlist) {
                        if (textlist.scrollSound)
                            textlist.scrollsoundaudio_id =
                                 getAudioId(textlist.scrollSound, path);
                    });
                }
                if (view.sound)
                {
                    angular.forEach(view.sound, function(sound)
                    {
                        if (sound.path)
                        {
                            sound.audio_id = getAudioId(sound.path, path);
                        }
                    });
                }
            });
        }

        // change an 'obj' position and size when 'width' is inserted at 'insert_x'
        // if width==0 means reset view back to orig theme values
        function objectReposition(obj, insert_x, width, gamelist_top, gamelist_bottom)
        {
            // not a thing we can move
            if (!obj.div || !obj.pos)
            {
                return;
            }
/*
            var size = obj.size || obj.maxSize;
            if(!size || size.w==1 || !size.h)
            {
                return;
            }
            var pos_top = obj.pos.y
            var pos_bottom = obj.pos.y + size.h;
            if (obj.origin)
            {
                pos_top -= size.h * obj.origin.y;
                pos_bottom -= size.h * obj.origin.y;
            }
*/

            // above or below gamelist
            if( obj.top >= gamelist_bottom || obj.bottom <= gamelist_top)
            {
                return;
            }

            // position
            var x = width
                      ? xReposition(obj.pos.x, insert_x, width)  // move/scale
                      : obj.pos.x;  // reset back to normal

            // apply position change to style
            obj.div['left'] = util.pct(x,'vw');

            // size
            var w;
            if (obj.size)
            {
                w = width
                      ? xReposition(obj.pos.x + obj.size.w, insert_x, width) - x  // move/scale
                      : obj.size.w;  // reset back to normal
            }
            else if (obj.maxSize)
            {
                w = width
                      ? xReposition(obj.pos.x + obj.maxSize.w, insert_x, width) - x  // move/scale
                      : obj.maxSize.w;  // reset back to normal
            }

            // apply size change to style
            if (w)
            {
                if (obj.div)
                {
                    if (obj.div['max-width'])
                    {
                        obj.div['max-width'] = util.pct(w,'vw');
                    }
                    if (obj.name == 'md_rating')
                    {
                        obj.div.width  = (100 * w) +'vh';
                        obj.div.height = (100 * w / 5) +'vh';
                    }
                    else if (obj.div['width'])
                    {
                        obj.div['width'] = util.pct(w,'vw');
                    }
                }
                if (obj.img)
                {
                    if (obj.img['max-width'])
                    {
                        obj.img['max-width'] = util.pct(w,'vw');
                    }
                    if (obj.img['width'])
                    {
                        obj.img['width']      = util.pct(w,'vw');
                    }
                }
            }
        }

        function setHelpbarStyle(view, system)
        {
            // look for helpbar style in :-
            //     current view
            //     otherwise use system view
            var help;

            if (view && view.helpsystem)
            {
                help = view.helpsystem.help
            }
            else if (system &&
                        system.view &&
                        system.view.system &&
                        system.view.system.helpsystem)
            {
                help = system.view.system.helpsystem.help;
            }
            else {
                help = {};
            }

            if (!help.div)
            {
                help.div = {};
            }

            if(help.fontSize)
            {
                help.div['font-size'] = util.pct(help.fontSize, 'vh');
            }
            help.div['line-height'] = (help.height / help.fontSize) + '%';

            if (help)
            {
                // already done?
                if (self.help == help) return;

                self.help = help;
            }

            // set up styles
            if (!self.helpTextColorBorder)    self.helpTextColorBorder = {}
            if (!self.helpInverseBackground) self.helpInverseBackground = {}

            // Defaults if not included within theme
            var pos = {x: 0, y: 0.945};
            self.helpTextColor = '777777';
            self.helpIconColor = '777777';

            if (help)
            {
                if (help.textColor) self.helpTextColor = help.textColor;
                if (help.iconColor) self.helpIconColor = help.iconColor;
                if (help.pos)
                {
                    help.pos = denormalize('pos',help.pos);

                    // If theme hides the helpbar, show at bottom
                    if (help.pos.x>=1 || help.pos.y>=1 ||
                         help.pos.x<0 || help.pos.y<0)
                    {
                        help.pos = pos;
                        delete help.div['font-size'];

                        help.div.left = util.pct(help.pos.x,'vw');
                        help.div.top = util.pct(help.pos.y,'vh');
                        delete help.div.display;
                    }
                    else
                    {
                        pos = help.pos;
                    }
                }

            }
            self.helpInverseBackground['background-color'] = '#'+self.helpTextColor.substring(0,6);

            self.helpMenuOptionClasses = 'dropdown-options';
            self.helpMenuOptionClasses += ' ' + (util.isLight(self.helpTextColor) ? 'dark':'light');
            self.helpMenuOptionClasses += ' ' + (pos.y < 0.5 ? 'down':'up');
            self.helpMenuOptionClasses += ' ' + (pos.x < 0.3 ? '':'right');

            if (util.isLight(self.helpTextColor))
            {
                self.helpInverseForegroundClass = 'inverseDarkForeground';
            }
            else
            {
                self.helpInverseForegroundClass = 'inverseLightForeground';
            }

            self.helpTextColorBorder.color = '#'+self.helpTextColor.substring(0,6);
            self.helpTextColorBorder.border = '1px solid #'+self.helpTextColor.substring(0,6);
        }


        // for animating system images when carousel changes
        function setSystemImagesContainerStyle(cell, pct)
        {
            //var cell = {position: 'absolute'};
            cell.position = 'absolute';
            var left = null
            var top = null;
            var width = 1;
            var height = 1;
            var opacity = null;

            // vertical scroll
            if ( config.app.ViewTransitions=='Slide')
            {
                if ( self.carousel.type == 'vertical' || self.carousel.type == 'vertical_wheel')
                {
                    // work in units of logo distance rather than screen position
                    // so 1 = mouse movement between two logos
                    // instead of a full screen
                    pct /= self.carousel.logo_vh;
                
                    if (pct == 0)
                    {
                        top = cell.index;
                    }
                    else
                    {
                        top = cell.index * (1 - pct) + (cell.index + 1) * pct;
                    }
                    left = 0;
                }
                else
                {
                    pct /= self.carousel.logo_vw;

                    top = 0;
                    if (pct == 0)
                    {
                        left = cell.index;
                    }
                    else
                    {
                        left = cell.index * (1 - pct) + (cell.index + 1) * pct;
                    }
                }
            }
            else if ( config.app.ViewTransitions=='Fade')
            {
                if(cell.index==-1)
                {
                    opacity = 0;
                }
                else if(cell.index==0)
                {
                    opacity = 1;
                }
                else
                {
                    opacity = 0;
                }
            }

            if (left != null)
            {
                cell.left    = util.pct(left,'vw');
                cell.top     = util.pct(top,'vh');
            }
            if (opacity != null)
            {
                cell.opacity = opacity;
            }

            cell.width  = util.pct(width,'vw');
            cell.height = util.pct(height,'vh');

            //createClass('system_images'+cell.index, style);
        }


        function setSystemLogoStyle(cell, pct)
        {
            var index;
            var left = null;
            var top = null;
            var height;
            var width;
            var scale;
            var fontsize;
            var opacity;
            var zIndex = parseInt(self.carousel.zIndex) || 40;
            
            cell.position = 'absolute';
            cell.top = '50%';
            cell.left = '50%';
            cell['-webkit-transform'] =
            cell['-ms-transform'] =
            cell.transform = 'translate(-50%,-50%)';

            if (self.carousel.type == 'vertical')
            {
                 index = cell.index + pct / self.carousel.logo_vh;
                 top    = pct
                            + self.carousel.size.h / 2         // half way vertically in carousel area
                            + cell.index * self.carousel.logo_vh;                // index position
            }
            else if (self.carousel.type == 'vertical_wheel')
            {
                index = cell.index + pct / self.carousel.logo_vh;

                if (self.carousel.logoAlignment == 'left')
                {
                    left = 0.04 + self.carousel.logoSize.w / 2;
                }
                else if (self.carousel.logoAlignment == 'right')
                {
                    left = 0.96 - self.carousel.logoSize.w / 2;
                }

                cell['-ms-transform-origin'] =
                cell['-webkit-transform-origin'] =
                cell['transform-origin'] = util.pct(self.carousel.logoRotationOrigin.x, '%') + ' ' +
                                           util.pct(self.carousel.logoRotationOrigin.y, '%');

                cell.transform += ' rotate('+(index * (parseFloat(self.carousel.logoRotation) || 7.5))+'deg) ';

                cell['-ms-transform'] = cell['-webkit-transform'] = cell.transform;
            }
            else  // horizontal
            {
                 index = cell.index + pct / self.carousel.logo_vw;
                 left  = pct
                            + self.carousel.size.w / 2         // half way horizontally in carousel area
                            + cell.index * self.carousel.logo_vw;                // index position
            }

            if (index==0 || index == '0')    // Center
            {
                 scale = self.carousel.logoScale;
                 cell['z-index'] = zIndex + 3;
                 opacity = 1;
            }
            else if (index > -1 && index < 1)  // almost center
            {
                 pct = Math.abs(index);
                 scale = (self.carousel.logoScale * (1 - pct)) + pct;
                 opacity = 1 - (0.5 * pct); // (1 - pct) + (0.5 * pct);
                 cell['z-index'] = zIndex + 2;
            }
            else
            {
                 scale = 1;
                 opacity = 0.5;
                 cell['z-index'] = zIndex + 1;
            }

            width = self.carousel.logoSize.w * scale;
            height = self.carousel.logoSize.h * scale;
            fontsize = height * self.carousel.fontSize;

            if (left != null)
            {
                cell.left    = util.pct(left,'vw');
            }
            if (top != null)
            {
                cell.top     = util.pct(top, 'vh');
            }
            cell.width  = util.pct(width,'vw');
            cell.height = util.pct(height,'vh');
            cell.opacity = opacity;
            cell['font-size'] = util.pct(fontsize, 'vmin');
        }

        // calculate x changed position
        // used to insert space mid screen, move everything right (E.g extra list columns)
        // units are 0 to 1 from left to right
        function xReposition(x, insert_x, width)
        {
            // edges remain the same
            if (!x) return 0; // calc below should do the same but avoids rounding issues
            if (x==1) return 1;

            // either side of insert_x shrink by width%

            if (x <= insert_x)            // to the left
            {
                return x / ( 1 + width );
            }
            else                              // to the right
            {
                return ( x + width ) / ( 1 + width );
            }
        }

    }

})();

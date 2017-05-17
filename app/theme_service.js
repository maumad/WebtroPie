'use strict';

angular.module('WebtroPie.theme_service', [])

.service('ThemeService', function($http, $q,
                                  $document, $window,
                                  config, util)
{
   var self = this;

   // Variables :-

   // each theme has an array of systems that it supports

   // index pointing to the system in self.theme.systems array
   self.system_index = 0; // the first index in the array (alphabetically sorted)

   // self.system is the system object from self.theme.systems array
      // E.g 'AmstradC64' object

   // can only be set after Theme is fetched
      // self.system = self.theme.systems[self.system_index];

   // arrays for dynamically loaded content
   self.fontfamilies = {};
   self.audio = {};

   self.dontstretch = {
      'crt': 1,
      'eudora': 1,
      'eudora-bigshot': 1,
      'flat': 1,
      'flat-dark': 1,
      'fundamental': 1,
      'futura-10px': 1,
      'futura-10px-dark': 1,
      'indent': 1,
      'io': 1,
      'luminous': 1,
      'metapixel': 1,
      'new-mini': 1,
      'oldroom 720p': 1,
      'oldroom 1080p': 1,
      'pixel': 1,
      'simpler-turtlepi': 1,
      'spare': 1,
      'turtle-pi': 1,
      'workbench': 1
   }

   // load up (current) theme from memory otherwise from server
   self.themeInit = function(system_name, view_name)
   {
      return self.getTheme(config.app.ThemeSet, system_name, view_name);
   }

   // system_index is int index for the systems array containing
   // system, ensure it is always between 0 and array.length
   self.checkBounds = function(system_index)
   {
      return (system_index + self.theme.systems.length)
                  % self.theme.systems.length;
   }

   // return E.g previous or next system
   self.getThemeSystemByOffset = function(change_ix)
   {
      return self.theme &&
             self.theme.systems[self.checkBounds(self.system_index + change_ix)]
   }

   self.setHelpStyle = function(help)
   {
      // look for helpbar style in :-
      //    current view
      //    otherwise use system view
      if (!help)
      {
         if (self.view && self.view.helpsystem)
         {
            help = self.view.helpsystem.help
         }
         else if (self.system && self.system.view.system)
         {
            help = self.system.view.system.helpsystem.help;
         }
      }

      if (help)
      {
         // already done?
         if (self.help == help) return;

         self.help = help;
      }

      // set up styles
      if (!self.helpTextColorBorder)   self.helpTextColorBorder = {}
      if (!self.helpInverseBackground) self.helpInverseBackground = {}

      // Defaults if not included within theme
      var pos = {x: 0, y: 0.945};
      self.helpTextColor = '777777';
      self.helpIconColor = '777777';

      if (help)
      {
         if (help.textcolor) self.helpTextColor = help.textcolor;
         if (help.iconcolor) self.helpIconColor = help.iconcolor;
         if (help.pos)       pos = help.pos;
      }
      self.helpInverseBackground['background-color'] = '#'+self.helpTextColor.substring(0,6);

      self.helpMenuOptionClasses = 'dropdown-options';
      self.helpMenuOptionClasses += ' ' + (util.isLight(self.helpTextColor) ? 'dark':'light');
      self.helpMenuOptionClasses += ' ' + (pos.y < 0.5 ? 'down':'up');

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

   self.setHelpStyle();

   self.switchView = function(view_name)
   {
      self.setSystemByIndex(self.system_index, view_name);
      util.defaultFocus();
   }

   // change system by system index
   // creates easy access to deep branches of the themes tree
   // self.system   = self.theme.systems[self.system_index]
   // self.view     = self.theme.systems[self.system_index].view[view_name]
   // self.gamelist = self.theme.systems[self.system_index].view[view_name].textlist.gamelist
   self.setSystemByIndex = function(system_index, view_name)
   {
      if (!self.theme.systems)
      {
         self.setHelpStyle();
         return;
      }

      // ensure index between 0 and systems length
      self.system_index = self.checkBounds(system_index);

      // set self.system to point to theme/system object
      self.system = self.theme.systems[self.system_index];

      // if not passed in, assume the same view as before
      if (!view_name && self.view)
      {
         view_name = self.view.name;
      }

      if (view_name)
      {
         // set self.view to the theme/system/view object
         self.view = self.system.view[view_name];

         if (self.view.textlist && view_name != 'system')
         {
            // create shortcut for theme gamelist view object
            self.gamelist = self.view.textlist.gamelist;
            if (self.applyGamelistFieldsShown)
            {
               self.applyGamelistFieldsShown();
            }
         }
      }
      else 
      {
         delete self.view;
         delete self.gamelist;
      }

      self.setHelpStyle();
   }

   // E.g when theme has changed
   self.setCurrentSystem = function()
   {
      self.setSystemByIndex(self.system_index);
   }

   // call setSystemByIndex for the system of the name specified
   self.setSystemByName = function(system_name, view_name, nocheck)
   {
      if (!self.theme.systems)
      {
         return;
      }
      var sys_ix=0;
      if (system_name != 'all')
      for(var i=0; i<self.theme.systems.length; i++)
      {
         if (self.theme.systems[i].name == system_name)
         {
            sys_ix = i;
            break;
         }
      }
      if (!view_name && self.view)
      {
         view_name = self.view.name;
      }
      if (!self.theme.systems[sys_ix].view[view_name] ||
          !view_name)
      {
         if (self.theme.systems[sys_ix].view.video)
            view_name = 'video';
         else if (self.theme.systems[sys_ix].view.detailed)
            view_name = 'detailed';
         else
            view_name = 'basic';
      }

      if (!nocheck &&
          self.system && self.system.name == system_name &&
          ((self.view && self.view.name == view_name) ||
           (!self.view && !view_name)))
      {
         return; // already set
      }

      if (system_name=='all')
      {
         self.setSystemByIndex(self.theme.systems.length-1,'detailed');
      }
      else
      {
         self.setSystemByIndex(sys_ix, view_name);
      }
   }

   // navigate to the rom lists view
   self.goSystemDetail = function(system_index, replace)
   {
      self.playSound('systemselect');
      delete self.system;
      delete self.view;
      system_index = self.checkBounds(system_index);
      var system_name = self.theme.systems[system_index].name;
      if (replace)
      {
         util.go('/'+system_name); // no navigation history
      }
      else
      {
         util.call('/'+system_name); // E.g navigate to 'n64'
      }
   }

   // roll systems left
   self.previousSystem = function()
   {
      self.playSound('systemscroll');
      self.setSystemByIndex(self.system_index-1);
   }

   // roll systems right
   self.nextSystem = function(change_ix)
   {
      if (!change_ix)
      {
         change_ix=1;
      }
      self.playSound('systemscroll');
      self.setSystemByIndex(self.checkBounds(self.system_index+change_ix));
   }

   // Theme file loading -----------------------------------------

   // convert string float pair into object  E.g. "0 1" to {x: 0, y: 1}
   self.denormalize = function(type, str)
   {
      if (!str)
      {
         return;
      }

      if (str.match(/-*[0-9][0-9\.]*  *-*[0-9][0-9\.]*/))
      {
         var arr = str.split(" ");
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

   // Store full font path relative to the file it was included in
   // (so that the path doesn't get lost after expansion)
   self.loadFonts = function(themefile, path, type)
   {
      if (!themefile || !themefile.view)
      {
         return;
      }

      angular.forEach(themefile.view, function(view)
      {
        angular.forEach(view[type], function(text)
        {
           if (text.name && text.fontpath)
           {
              if (text.fontpath.substr(0,2) == './')
              {
                 text.fontpath = text.fontpath.slice(2);
              }
              text.fullpath = path+'/'+text.fontpath;
              text.fullpath = text.fullpath
                                  .replace(/[^\/]*\/\.\.\//g, '');  // replace parent/../ with ''
              text.fontfamily = text.fullpath
                                  .replace(/(\/|-)/g, "_")      // replace /, - with _
                                  .replace(/(\..*|\/)/g, '')    // remove extension
                                  .substring(11);
              self.loadFontFamily(text);
              delete text.fullpath;
              delete text.fontpath;
           }
        });
      });
   }

   // dynamically load the font face
   self.loadFontFamily = function(text)
   {
      if (self.fontfamilies[text.fontfamily]) // already loaded
      {
         return;
      }

      var style_el = $document[0].createElement('style');
      style_el.innerHTML = "@font-face {font-family: '"+ text.fontfamily + "';"+
                                     "src: url('" + text.fullpath + "');}";
      $document[0].body.appendChild(style_el);

      self.fontfamilies[text.fontfamily] = style_el;;
   }

   // dynamically load all sounds
   self.loadSounds = function(themefile, path)
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
               if (textlist.scrollsound)
                  textlist.scrollsoundaudio_id =
                      self.getAudioId(textlist.scrollsound, path);
            });
         }
         if (view.sound)
         {
            angular.forEach(view.sound, function(sound)
            {
               if (sound.path)
               {
                  sound.audio_id = self.getAudioId(sound.path, path);
               }
            });
         }
      });
   }

   // generate an id from the filename
   self.getAudioId = function(filename, path)
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
                       .replace(/(\/|-)/g, "_")      // replace /, - with _
                       .replace(/(\..*|\/)/g, '')    // remove extension
                       .substring(11);               // remove 'svr/themes'

         return self.load_audio(id, fullpath);
      }
   }

   // dynamically create audio element and it's source,
   // store audio element in an array for later lookup
   self.load_audio = function(id, filename)
   {
      if (self.audio[id]) // already loaded
      {
         return id;
      }

      var audio = document.createElement('audio');
      var source = document.createElement('source');
      source.src=filename;
      audio.appendChild(source);

      self.audio[id] = audio;

      return id;
   }

   // for the current theme using the sound name (E.g. scrollsystem)
   // look up the audio_id (E.g. carbon_click)
   self.playSound = function(sound)
   {
      var audio_id, audio;

      if (self.view &&
         self.view.sound &&
         self.view.sound[sound])
      {
         audio_id = self.view.sound[sound].audio_id;
      }
      else if (self.gamelist &&
              self.gamelist[sound+'audio_id'])  // scrollsound
      {
         audio_id = self.gamelist[sound+'audio_id'];
      }

      if (audio_id)
      {
         self.audio[audio_id].play();
      }
   }

   // translate path relative to file or include file
   // then simplify
   self.fullpath = function(object, field, path)
   {
      if (object[field].substr(0,2) == './')  // strip ./
      {
         object[field] = object[field].slice(2);
      }

      object.type = object[field].slice(-3).toLowerCase(); // extension
      object['full'+field] = path+'/'+object[field]; // create full path

      // simplify parent/../ to ''  (twice) (.. doesn't play nice in url!)
      object['full'+field] = object['full'+field].replace(/[^\/]*\/\.\.\//, '');
      object['full'+field] = object['full'+field].replace(/[^\/]*\/\.\.\//, '');
   }

   // Store full image path relative to the file it was included in
   // (so that the path doesn't get lost after expansion)
   self.fullImagePaths = function(themefile, path, file_count)
   {
      if (!themefile || !themefile.view)
      {
         return;
      }

      angular.forEach(themefile.view, function(view)
      {
         angular.forEach(view.video, function(video)
         {
            if (video.default)
            {
               self.fullpath(video, 'default', path);
            }
         });

         angular.forEach(view.image, function(image)
         {
            if (image.name && image.path)
            {
               self.fullpath(image, 'path', path);
               image.index += file_count * 5;
            }
         });

         // expand paths of rating star images if themed
         if (view.rating && view.rating.md_rating)
         {
            if (view.rating.md_rating.unfilledpath)
            {
               self.fullpath(view.rating.md_rating, 'unfilledpath', path);
            }
            if (view.rating.md_rating.filledpath)
            {
               self.fullpath(view.rating.md_rating, 'filledpath', path);
            }
         }
      });
   }

   // calculate x changed position
   // used to insert space mid screen, move everything right (E.g extra list columns)
   // units are 0 to 1 from left to right
   self.xReposition = function(x, insert_x, width)
   {
      // edges remain the same
      if (!x) return 0; // calc below should do the same but avoids rounding issues
      if (x==1) return 1;

      // either side of insert_x shrink by width%

      if (x <= insert_x)         // to the left
      {
         return x / ( 1 + width );
      }
      else                       // to the right
      {
         return ( x + width ) / ( 1 + width );
      }
   }

   // change an 'obj' position and size when 'width' is inserted at 'insert_x'
   // if width==0 means reset view back to orig theme values
   self.objectReposition = function(obj, insert_x, width, gamelist_top, gamelist_bottom)
   {
      // not a thing we can move
      if (!obj.div || !obj.pos)
      {
         return;
      }
/*
      var size = obj.size || obj.maxsize;
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
              ? self.xReposition(obj.pos.x, insert_x, width)  // move/scale
              : obj.pos.x;  // reset back to normal

      // apply position change to style
      obj.div['left'] = util.pct(x,'vw');

      // size
      var w;
      if (obj.size)
      {
         w = width
              ? self.xReposition(obj.pos.x + obj.size.w, insert_x, width) - x  // move/scale
              : obj.size.w;  // reset back to normal
      }
      else if (obj.maxsize)
      {
         w = width
              ? self.xReposition(obj.pos.x + obj.maxsize.w, insert_x, width) - x  // move/scale
              : obj.maxsize.w;  // reset back to normal
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
               obj.img['width']     = util.pct(w,'vw');
            }
         }
      }
   }

   // Insert object (column of gamelist) into view
   // but only between top and bottom of gamelist
   self.insertIntoView = function(view, insert_x, width, gamelist_top, gamelist_bottom)
   {
      angular.forEach(view.image, function(image)
      {
         self.objectReposition(image, insert_x, width, gamelist_top, gamelist_bottom);
      });
      angular.forEach(view.text, function(text)
      {
         self.objectReposition(text, insert_x, width, gamelist_top, gamelist_bottom);
      });
      angular.forEach(view.datetime, function(text)
      {
         self.objectReposition(text, insert_x, width, gamelist_top, gamelist_bottom);
      });
      angular.forEach(view.textlist, function(textlist)
      {
         self.objectReposition(textlist, insert_x, width, gamelist_top, gamelist_bottom);
      });
      angular.forEach(view.rating, function(rating)
      {
         self.objectReposition(rating, insert_x, width, gamelist_top, gamelist_bottom);
         // TODO: check height, aspect ratio still shows 5 stars ?
      });
      angular.forEach(view.video, function(video)
      {
         self.objectReposition(video, insert_x, width, gamelist_top, gamelist_bottom);
      });
/*
      angular.forEach(view.marquee, function(marquee)
      {
         self.objectReposition(marquee, insert_x, width, gamelist_top, gamelist_bottom);
      });
*/
      if (!self.orig_width)
      {
         self.orig_width = $window.outerWidth;
         self.orig_height = $window.outerHeight;
      }

      // increase the window size,  worth a go but most browser wont comply
      // so the scale will appear to change instead of the window expanding
      //$window.resizeTo($window.innerWidth * ( 1 + width ), $window.innerHeight);
      $window.resizeTo(self.orig_width * ( 1 + width ), self.orig_height);
   }

   // fire reset on everything
   self.resetView = function(view)
   {
      self.insertIntoView(view, 0, 0);
      if (self.orig_width)
         $window.resizeTo(self.orig_width, self.orig_height);
   }

   // multiline text style
   self.createTextStyleML = function(text)
   {
      self.createTextStyle(text, true);
   }

   // convert theme text attributes to style
   self.createTextStyle = function(text, allow_multiline)
   {
      if (typeof text != 'object')
      {
         return;
      }

      text.div = {};

      if (text.name == "help")
      {
         if (!text.textcolor)
         {
            text.textcolor = '777777';
         }
         if (!text.iconcolor)
         {
            text.iconcolor = '777777';
         }
         text.div.color = '#'+text.textcolor.substring(0,6);
      }
      else if (!text.pos)
      {
         // anchored to label so position inside label (see theme_components)
         if (text.name.substring(0,3)=='md_')
         {
            text.div.display = 'inline';
            text.div.position = 'relative';
            if (!text.fontfamily)
            {
               text.div['font-family'] = 'ohc_regular';
            }
            text.div['margin-left'] = '0.5vw';
         }
         else
         {
            text.div.display = 'none';
            return;
         }
      }

      if (text.pos)
      {
         text.pos = self.denormalize('pos',text.pos);

         if (text.pos.x>=1 || text.pos.y>=1 ||
             text.pos.x<0 || text.pos.y<0)
         {
            text.div.display = 'none';
            return;
         }

         text.div.left = util.pct(text.pos.x,'vw');
         text.div.top = util.pct(text.pos.y,'vh');
      }

      if (text.fontsize)
      {
         text.fontsize = util.round(text.fontsize,6);
      }

      // default size for helpsystembar
      if (text.name == "help" && !text.size)
      {
         text.size = {w: text.pos
                         ? 1 - text.pos.x  // to right edge
                         : 1,              // full width
                      h: text.fontsize
                         ? text.fontsize + 0.01  // padding 
                         : 0.045};
      }
      else if (text.size)
      {
         text.size = self.denormalize('size',text.size);

         // don't allow gamelist off screen, I'm looking at you 'clean-look' theme
         if (text.name == 'gamelist' && text.pos.x + text.size.w > 0.995)
         {
            text.size.w = 0.995 - text.pos.x;
         }
      }
      self.calcObjBounds(text);

      if (text.size)
      {
         if (text.fontsize)
         {
            if (text.size.h < text.fontsize)
            {
               text.size.h = text.fontsize;
            }
         }
         else
         {
            //text.fontsize = text.size.h;
            text.fontsize = 0.035;
         }

         if (text.size.w && !text.size.h)  // wrap, expand h dynamically
         {
            text.div['max-width'] =
            text.div.width = util.pct(text.size.w,'vw');
            if (allow_multiline)
            {
               text.multiline = true;
            }
         }
         else if (!allow_multiline)    // not textbox
         {
            if (text.size.w)
            {
               text.div.width = util.pct(text.size.w,'vw');
            }
            if (text.size.h)
            {
               text.div.height = util.pct(text.size,'vh');
            }
         }
         else if (text.size.w && text.size.h)
         {
            text.div.width = util.pct(text.size.w,'vw');
            text.div.height = util.pct(text.size.h,'vh');
            if (text.size.h >= text.fontsize * 2)  // h can fit two lines
            {
               text.multiline = true;
            }
         }
      }

      if (!text.linespacing)
      {
        text.linespacing = 1;
      }
      text.linespacing = util.round(text.linespacing * 1.1 ,4);

      if (text.fontsize)
      {
         text.div['font-size'] = util.pct(text.fontsize,'vh');
         if (text.size)
         {
            text.rows = Math.floor(100 * text.size.h /
                                  (100 * text.fontsize * text.linespacing));
         }
         else
         {
            text.rows = 1;
         }
         if (text.rows>1 && text.linespacing)
         {
            // minimum linespace for multiline
            if (text.linespacing <= 1.3)
            {
               text.linespacing = 1.3;
               text.rows = Math.floor(100 * text.size.h /
                                     (100 * text.fontsize * text.linespacing));
            }
            text.div['line-height'] = (100 * text.linespacing ) + '%';
         }
         else if (text.size && text.size.h)
         {
            text.div['line-height'] = (100 * text.size.h / text.fontsize ) + '%';
         }
         else
         {
            text.div['line-height'] = '100%';
         }
      }
      else if (text.multiline)
      {
         text.div['line-height'] = (100 * text.linespacing ) + '%';
      }
      else
      {
         text.div['line-height'] = '100%';
      }

      if (text.color)
      {
         text.div.color = '#'+text.color;
      }

      if (text.fontfamily)
      {
         text.div['font-family'] = text.fontfamily;
      }

      if (parseInt(text.forceuppercase))
      {
         text.div['text-transform'] = 'uppercase';
      }

      //if(text.horizontalmargin)
         //text.div['padding-left'] = util.pct(text.horizontalmargin,'%');

      if (text.alignment)
      {
         text.div['text-align'] = text.alignment;
      }
   }

   // set up position, background / foregrund stars
   self.createRatingStyle = function(rating)
   {
      if(!rating || typeof rating != 'object')
      {
         return;
      }

      var style = {position: 'absolute'}
      var stars = {}

      rating.pos = self.denormalize('pos',rating.pos);
      if (!rating.pos)
      {
         style.display = 'none';
/*
         style.display = 'inline';
         style.position = 'relative';
         style['margin-left'] = '0.5vw';
*/
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
            rating.size = self.denormalize('size',rating.size);

            // theme should only have w or h not both
            if (rating.size.h)
            {
               rating.size.w = rating.size.h * 5;
            }
            else if (rating.size.w)
            {
               rating.size.h = rating.size.w / 5;
            }

            if (rating.size.h)
            {
               style.height = (100*rating.size.h)+'vh';
            }
            if (rating.size.w)
            {
               style.width = (100*rating.size.w)+'vh';
            }
         }
         if (rating.fullunfilledpath)
         {
            style['background-image'] = 'url("' + rating.fullunfilledpath + '")';
         }
         if (rating.fullfilledpath)
         {
            // make the stars gold, hopefully not annoy theme designers
            stars['background-image'] = 'url("svr/color_img.php?file='+ // make it gold
                    rating.fullfilledpath.substring(4) + '&color=FFD400")';
            // original colour would be :-
            //stars['background-image'] = 'url("' + rating.fullfilledpath + '")';
         }
      }
      self.calcObjBounds(rating);
      rating.div = style;
      rating.stars = stars;
   }

   self.calcObjBounds = function(obj)
   {
      // not a thing we can move
      if (!obj.pos)
      {
         return;
      }
      var size = obj.size || obj.maxsize;
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


   self.createCarouselStyle = function(carousel, logo)
   {
      if (!carousel || (typeof carousel) != 'object')
      {
         return;
      }

      var style = {};

      if (carousel.pos)
      {
         carousel.pos = self.denormalize('pos',carousel.pos);
         style.left = util.pct(carousel.pos.x,'vw');
         style.top = util.pct(carousel.pos.y,'vh');
         logo.div.top = util.pct(carousel.pos.y+16,'vh');
      }
      if (carousel.size)
      {
         carousel.size = self.denormalize('size',carousel.size);
         if (carousel.size.w)
         {
            style.width = util.pct(carousel.size.w,'vw');
         }
         if (carousel.size.h)
         {
            style.height = util.pct(carousel.size.h,'vh');
         }
      }
      if (carousel.logosize)
      {
         carousel.logosize = self.denormalize('size',carousel.logosize);
      }
      if (carousel.color)
      {
         //style['background-color'] = util.hex2rgba(carousel.color);
            var hsl = util.rgbToHSL(carousel.color);

            if(//hsl.h == 0 && hsl.s == 0 &&
               hsl.l > 0.5)  // light
            {
               style.filter = 'brightness('+util.pct(hsl.l,'%')+')';
               if (hsl.a || hsl.a === 0)
               {
                  style.filter += ' opacity('+util.pct(hsl.a,'%')+')';
               }
            }
            else //if(hsl.h == 0 && hsl.s == 0)  // dark
            {
               style.filter = 'invert(100%) saturate(0%)'; // contrast(100%)';
               style.filter += ' contrast('+util.pct(1-hsl.l,'%')+')';
               if (hsl.a || hsl.a === 0)
               {
                  style.filter += ' opacity('+util.pct(hsl.a,'%')+')';
               }
            }
      }
      style['position'] = 'absolute';
      style['z-index'] = 10;

      carousel.div = style;
   }

   self.createVideoStyle = function(video)
   {
      if (!video || (typeof video) != 'object')
      {
         return;
      }

      var style = {};

      if (video.showsnapshotnovideo == 'true') {
         style['background-size'] = 'contain';
         style['background-repeat'] = 'no-repeat';
      }

      if (video.pos)
      {
         video.pos = self.denormalize('pos',video.pos);
         style.left = util.pct(video.pos.x,'vw');
         style.top = util.pct(video.pos.y,'vh');
      }

      if (video.origin)
      {
         video.origin = self.denormalize('pos',video.origin);
         if (video.origin.x!=0 || video.origin.y!=0)
         {
            style.transform = 'translate('+
                                 util.pct(-video.origin.x,'%')+','+
                                 util.pct(-video.origin.y,'%')+')';
         }
      }

      if (video.size)
      {
         video.size = self.denormalize('size',video.size);
         if (video.size.w)
         {
            style.width = util.pct(video.size.w,'vw');
         }
         if (video.size.h)
         {
            style.height = util.pct(video.size.h,'vh');
         }
      }
      if (video.maxsize)
      {
         video.maxsize = self.denormalize('size',video.maxsize);
         if (video.maxsize.w)
         {
            style['max-width'] = util.pct(video.maxsize.w,'vw');
         }
         if (video.maxsize.h)
         {
            style['max-height'] = util.pct(video.maxsize.h,'vh');
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
/*
      style.width = style['max-width'];
      style.height = style['max-height'];
      delete style['max-width'];
      delete style['max-height'];
*/
      style['background-position'] = bp_h + ' ' + bp_v;

      self.calcObjBounds(video);

      style['position'] = 'absolute';
      //style['z-index'] = 7;
      style['z-index'] = 10;

      video.div = style;
   }

   // convert theme image attributes to style
   self.createImageStyle = function(image)
   {
      // skip non image
      if (!image.name)
      {
         return; // continue
      }

      var style = {}
      style['position'] = 'absolute';

      // flag if image fills screen
      if ( (image.pos=='0 0' && image.size=='1 1') ||
          (!image.pos && !image.size) )
      {
         image.fullscreen = true;
         image.pos = '0 0';
         image.size = '1 1';
         //image.index = image.name == 'background' ? 0 : 1;
         image.index = 0;
      }

      if (image.pos)
      {
         image.pos = self.denormalize('pos',image.pos);
         style.left = util.pct(image.pos.x,'vw');
         style.top = util.pct(image.pos.y,'vh');
      }

      if (image.origin)
      {
         image.origin = self.denormalize('pos',image.origin);
         if (image.origin.x!=0 || image.origin.y!=0)
         {
            style.transform = 'translate('+
                                 util.pct(-image.origin.x,'%')+','+
                                 util.pct(-image.origin.y,'%')+')';
         }
      }

      if (image.size)
      {
         image.size = self.denormalize('size',image.size);
         if (image.size.w)
         {
            style.width = util.pct(image.size.w,'vw');
            if (!image.fullscreen && image.size.w >=1)
            {
               if (image.name == 'background')
               {
                  image.index = 0;
               }
               else
               {
                  image.index = image.pos.x == 0 && image.pos.y==0 ? 1 : 2;
               }
            }
         }
         if (image.size.h)
         {
            style.height = util.pct(image.size.h,'vh');
            if (!image.fullscreen && image.size.h >=1)
            {
               image.index = image.pos.x == 0 && image.pos.y==0 ? 1 : 2;
            }
         }
      }
      if (image.maxsize)
      {
         image.maxsize = self.denormalize('size',image.maxsize);
         if (image.maxsize.w)
         {
            style['max-width'] = util.pct(image.maxsize.w,'vw');
         }
         if (image.maxsize.h)
         {
            style['max-height'] = util.pct(image.maxsize.h,'vh');
         }
         //if (!image.size && image.name=='md_image')
         //{
            //style.width = style['max-width'];
            //style.height = style['max-height'];
         //}
      }
      self.calcObjBounds(image);

      // image file - not just a color
      if (image.fullpath || (image.name == 'md_image' || image.name == 'md_marquee'))
      {
         if ( image.color )
            image.color = image.color.toLowerCase();

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
            // color image server side if it's svg or if php has gd2 library enabled
            else
            if (image.fullpath && (image.type=='svg' || ( self.php_has_gd &&
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
               style.filter =
                     'sepia(100%) saturate(5000%) hue-rotate('+((hsl.h-60)%360)+'deg)';
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
            style.width = '100%';
            style.height = '100%';
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
               style.content = 'url("'+image.fullpath+'")';
            }

            // if theme has height 100% only and variable width make the width 100% anyway
            // i.e. stretch so no black left/right borders but aspect ratio will be wrong
            if (image.size && image.size.h==1)    // sorry themers!
            {
               style.width = '100vw';
            }
         }
      }
      // image is just a color with no image so just set background color
      else if (image.color)
      {
         style['background-color'] = util.hex2rgba(image.color);
      }

      // give background image z-index of 0
      // otherwise use order image appears in file (or included file?)
      //style['z-index'] = image.fullscreen || image.name == 'background'
      if (image.name == 'md_image' || image.name == 'md_marquee')
      {
         image.index = 50;
      }

      // not sure if this works for everything
      style['z-index'] = image.index; // + (image.extra ? 0 : 10); // non extra over extra
//console.log('image ' + image.name + ' z-index = ' + image.index);

      // no longer needed
      delete image.path;
      delete image.color;
      delete image.index;

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
   }


   // convert theme object images attributes to style
   self.createStyles = function(systheme, path)
   {
      // empty theme, shouldn't happen now as default is generated
      if (!systheme || !systheme.view)
      {
         return;
      }

      // each view - system, basic, detailed
      angular.forEach(systheme.view, function(view)
      {
         // fix wrong text tags in themes
         // releasedate should be datetime
         if (view.text && view.text.md_releasedate)
         {
            if (!view.datetime) view.datetime = {};
            if (!view.datetime.md_releasedate) view.datetime.md_releasedate = {};
            self.mergeObjects(view.datetime.md_releasedate, view.text.md_releasedate);
            delete view.text.md_releasedate;
         }
         // lastplayed should be datetime
         if (view.text && view.text.md_lastplayed)
         {
            if (!view.datetime) view.datetime = {};
            if (!view.datetime.md_lastplayed) view.datetime.md_lastplayed = {};
            self.mergeObjects(view.datetime.md_lastplayed, view.text.md_lastplayed);
            delete view.text.md_lastplayed;
         }
         // rating should be rating
         if (view.text && view.text.md_rating)
         {
            if (!view.rating) view.rating = {};
            if (!view.rating.md_rating) view.rating.md_rating = {};
            self.mergeObjects(view.rating.md_rating, view.text.md_rating);
            delete view.text.md_rating;
         }

         angular.forEach(view.text,     self.createTextStyleML); // allow multi line
         angular.forEach(view.textlist, self.createTextStyle);
         angular.forEach(view.datetime, self.createTextStyle);
         angular.forEach(view.image,    self.createImageStyle);
         angular.forEach(view.rating,   self.createRatingStyle);
         angular.forEach(view.helpsystem, self.createTextStyle);
         angular.forEach(view.video,    self.createVideoStyle);
      });
      if (systheme.view.system.carousel)
      {
         self.createCarouselStyle(systheme.view.system.carousel.systemcarousel,
                                  systheme.view.system.image.logo);
         if (!self.theme.systemcarousel)
         {
            self.theme.systemcarousel = systheme.view.system.carousel.systemcarousel;
         }
      }
   }

   // copy if target has missing value, or child value, or granchild value ...
   // used to merge properties from included theme file into theme
   // and expanding combined properties E.g. seperate "basic, detailed" view
   // into two seperate objects that may already exist
   self.mergeValue = function(target_obj, prop, value)
   {
      if (!target_obj[prop])   // empty / first time
      {
         if ((typeof value) == 'object')
         {
            target_obj[prop] = angular.copy(value);
            target_obj[prop].name = prop;
         }
         else
         {
            target_obj[prop] = value;
         }
      }
      else if ((typeof target_obj[prop]=='object') && (typeof value)=='object')
      {
         // recurse into children
         angular.forEach(value, function(v,k)
         {
            self.mergeValue(target_obj[prop], k, v);
         });
      }
   }

   // recurse whole target object and merge every value
   self.mergeObjects = function(target, source)
   {
      angular.forEach(source, function(value, key)
      {
         self.mergeValue(target, key, value);
      });
   }

   // expand combined properties E.g. seperate "basic, detailed" view
   // into two seperate objects
   self.expandMerged = function(target_obj)
   {
      // find everything that needs to be split - where the key contains a comma
      var tmp = {};
      var tmp2 = [];
      angular.forEach(target_obj, function(value, key)
      {
         // recursivley expand from bottom up
         if ((typeof value)=='object')
         {
            self.expandMerged(value);
         }

         // add to list of things to unsplit
         if ((typeof key)=='string' && key.indexOf(',')>=0)
         {
            tmp[key] = value;
            tmp2.push(key);
         }
      });
      // sort so that elements in duplicate combined sets
      // have presedence if in a smaller set
      // E.g Flat theme gamelist in 'detailed, video' and also
      // in 'basic, detailed, video'
      if (tmp2.length>1)
      {
         tmp2.sort(function(a, b)
         {
            if(a.length > b.length)
               return 1;
            if(a.length < b.length)
               return -1;
            return 0;
         });
      }

      // merge all of the splits
      //angular.forEach(tmp, function(value, key)
      angular.forEach(tmp2, function(key)
      {
         var value = target_obj[key];
         delete target_obj[key]; // remove combined from source
         var keys = key.split(/\s*,\s*/); // E.g. key = "basic, detailed"
         angular.forEach(keys, function(k)
         {
           self.mergeValue(target_obj, k, value);  // E.g. k = "basic"
         });
      });
   }

   // recurse whole target object and merge every value
   self.mergeThemes = function(target, filename, theme)
   {
      angular.forEach(theme.includes[filename], function(value, key)
      {
         // dont just merge the name property - include the whole file
         if (key == 'include')
         {
            self.mergeThemes(target, value, theme);
         }
         else
         {
            self.mergeValue(target, key, value);
         }
      });
   }

   // set the global current theme
   self.setTheme = function(theme, system_name, view_name)
   {
      self.theme = theme;

      //self.selected_theme = theme.name;
      config.app.ThemeSet = theme.name;

      // also ripple change to system theme change
      if (system_name)
      {
         self.setSystemByName(system_name, view_name, true);
      }
      else if (self.default_system_name)
      {
         self.setSystemByName(self.default_system_name, self.default_view_name, true);
      }
      else
      {
         self.setCurrentSystem();
      }

      delete self.default_system_name;
      delete self.default_view_name;
   }


   // get either from memory or server
   self.getTheme = function(themename, system_name, view_name)
   {
      // if ThemeSet not in config for some reason
      if (!themename)
      {
         themename = 'carbon';
      }

      // we might not have known the system on the first call
      if (!self.default_system_name && system_name)
      {
          self.default_system_name = system_name;
          self.default_view_name = view_name;
      }

      if (self.getting == themename && self.theme_promise)   // prevent multiple calls
      {
         return self.theme_promise;
      }

      var deferred = $q.defer();

      self.getting = themename;

      // return previously fully fetched theme
      if(self.themes &&
         self.themes[themename] &&
         self.themes[themename].path)
      {
         self.setTheme(self.themes[themename]);
         deferred.resolve();
         return deferred.promise;
      }

      self.theme_promise = deferred.promise;

      // fetch from server
      $http.get('svr/theme.php', {cache: false,
         params: {theme: themename //,
                    //all: config.app.LoadAllSystems
                    }
      })
      .then(function onSuccess(response)
      {
         self.theme = response.data; // self.theme is the current theme object
         self.php_has_gd = self.theme.has_gd;

         // themes is a list of all themes (for selection and to cache)
         if(!self.themes)
         {
            self.themes = {};
         }

         var file_count = 0;

         // expand each include file preserving paths
         angular.forEach(self.theme.includes, function(inc, filename)
         {
            angular.forEach(inc.feature, function(value, key)
            {
               if (key == 'supported')
                  return;
               if(!inc[key])
                  inc[key] = value;
               else
                  self.mergeObjects(inc[key], value);
               delete inc.feature[key];
            });
/*
            if (inc.feature && inc.feature.view)
            {
               if (!inc.view.video)
                  inc.view.video = inc.feature.view.video;
               else
                  self.mergeObjects(inc.view, inc.feature.view)
               delete inc.feature.video;
            }
*/
            var subdir = '';
            var i = filename.lastIndexOf('/');
            if(i>0)
            {
               subdir = '/'+filename.substring(0,i);
            }
            self.fullImagePaths(inc, self.theme.path+subdir, file_count++);
            self.loadFonts(inc, self.theme.path+subdir, 'text');
            self.loadFonts(inc, self.theme.path+subdir, 'textlist');
            self.loadFonts(inc, self.theme.path+subdir, 'datetime');
            self.loadFonts(inc, self.theme.path+subdir, 'helpsystem');
            self.loadSounds(inc, self.theme.path+subdir);
            self.expandMerged(inc);
         });

         // sort systems array by name
         if(self.theme.systems)
         {
            self.theme.systems.sort(function(a, b)
            {
               if(a.name > b.name)
                  return 1;
               if(a.name < b.name)
                  return -1;
               return 0;
            });
         }

         // expand system theme, merge in included files, then convert images
         angular.forEach(self.theme.systems, function(sys)
         {
            self.fullImagePaths(sys.theme, sys.path, file_count);
            self.loadFonts(sys.theme, sys.path, 'text');
            self.loadFonts(sys.theme, sys.path, 'textlist');
            self.loadFonts(sys.theme, sys.path, 'datetime');
            self.loadSounds(sys.theme, sys.path);

            // expand merged views etc
            self.expandMerged(sys);

            // include includes
            if (sys.theme && sys.theme.include)
            {
               angular.forEach(sys.theme.include, function(filename)
               {
                  self.mergeThemes(sys.theme, filename, self.theme);
               });
            }
            // convert images to css styles
            self.createStyles(sys.theme, sys.path);

            if (sys.theme)
            {
               sys.view = sys.theme.view;
               delete sys.theme;
            }

            // create convenient shortcuts
            if (sys.view)
            {
               if (sys.view.system.image.logo)
               {
                  sys.logo = 'url("'+sys.view.system.image.logo.fullpath+'")';
               }
            }
            //else
               //console.log(sys.theme); // theme doesn't have system?

         });

         // generate a theme to 'all' from the common
         // elements of first two non empty systems themes
         var all;
         if (self.theme.systems)
         {
            // make a generic system theme
            // copy first system then delete differences with second system
            angular.forEach(self.theme.systems, function(sys, index)
            {
               if (sys.view && !all)                      // first themed system
               {
                  all = angular.copy(sys);
               }
               else if (sys.view && !all.done)            // second themed system
               {
                  angular.forEach(sys.view, function(view, v)
                  {
                     angular.forEach(view.image, function(image, imagename)
                     {
                        if ((!image.name || image.name.substring(0,3) != "md_") &&
                           // compare both themes image paths :-
                           all.view[v].image[imagename] &&
                           image.fullpath != all.view[v].image[imagename].fullpath)
                        {
                           delete all.view[v].image[imagename].fullpath;
                           if (all.view[v].image[imagename].div)
                           {
                              delete all.view[v].image[imagename].div['background-image'];
                           }
                           if (all.view[v].image[imagename].img)
                           {
                              delete all.view[v].image[imagename].img['content'];
                           }
                        }
                     });
                     angular.forEach(view.text, function(text, textname)
                     {
                        // delete any ad hoc system specific text
                        if (!text.name)
                        {
                           delete all.view[v].text[textname].text;
                        }
                        else if(text.name.substring(0,3) != "md_" &&
                           // compare both themes text wording :-
                           text.text != all.view[v].text[textname].text)
                        {
                           delete all.view[v].text[textname].text;
                        }
                     });
                  });
                  all.done = true;
               }
            });
            all.name = 'all';
            all.path = 'srv/themes/'+themename+'/all';
            delete all.logo;
            self.theme.systems.push(all);

            // copy 'all' to all missing systems
            angular.forEach(self.theme.systems, function(sys, index)
            {
               if (!sys.view)
               {
                  self.mergeObjects(sys, all);
                  sys.view.basic.image.logo.text = sys.name;
                  sys.view.detailed.image.logo.text = sys.name;
                  sys.view.system.image.logo.text = sys.name;
               }
            });
         }

         // get/response also returns the list of other theme names available
         // (for the change theme selection data)
         self.theme_count = 0;
         angular.forEach(self.theme.themes, function(t)
         {
            if (!self.themes[t.name])
            {
               self.themes[t.name] = t; // just contains the name
            }
            self.theme_count++;
         });

         // store this fully expaned theme into the array for caching
         self.themes[themename] = self.theme;

         delete self.theme.themes;
         //delete theme.includes;

         self.setTheme(self.theme, system_name, view_name);

         deferred.resolve();
         self.getting = false;

         delete self.theme_promise;
      });

      return deferred.promise;
   }

});

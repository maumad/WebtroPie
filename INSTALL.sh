#!/bin/bash

# ------------
# INSTALLATION
# ------------

cd `dirname $0`              # this (script) directory (relative)
WebtroPie=`pwd`              # this (script) directory (full)
SVR=$WebtroPie/app/svr       # external content (images etc) to web serve
LIB=$WebtroPie/app/lib       # external libs

echo "WebtroPie can either run under Apache or standalone"
echo
echo "To access Emulationstation files and write to gamelist file WebtroPie must run as 'pi' user"
echo "Under Apache, the Apache webserver process itself must run as pi user for WebtroPie to have"
echo "the same permissions, choosing 'y' will change the Apache RUN_USER from www-data to pi"
echo "and also increase to PHP upload limits in php.ini"
echo
echo "Running standalone runs in a single thread, no changes are made to Apache or PHP but"
echo "WebtroPie may not run as reponsively as under Apache"
echo
read -p "Install to Apache? [y/n]: " apache

# Make sure you have the packages below :-
if [ $apache == "y" ]; then
    IP=`ifconfig | sed '/inet addr:.*255.255/!d;s|.*addr:|http://|;s|\s.*||'`
    echo
    read -p "Redirect ${IP} to ${IP}/app ? [y/n]: " redirect
    if [ $redirect == "y" ]; then
        cp "$WebtroPie/redirect.html" /var/www/html/index.html
    fi
    echo
    echo "Installing..."
    echo
    sudo apt-get install apache2 php5 libapache2-mod-php5 php5-gd -y
else
    sudo apt-get install php5 php5-gd -y
fi

#  fix permissions ?
sudo chown -R pi:www-data app
chown -f pi:www-data /dev/shm/runcommand.log
chown -f pi:www-data /dev/shm/retroarch.cfg
sudo find app -type f -exec chmod 664 {} \;
sudo find app -type d -exec chmod 775 {} \;

# create symlinks so we can web serve images and themes from the svr directory
sudo ln -sf /etc/emulationstation/themes                   $SVR
sudo ln -sf /home/pi/.emulationstation/downloaded_images   $SVR
sudo ln -sf /home/pi/RetroPie/roms                         $SVR

# download libs so that it can work offline in future
cd $LIB
wget -nc -nv https://ajax.googleapis.com/ajax/libs/angularjs/1.6.5/angular.min.js
wget -nc -nv https://ajax.googleapis.com/ajax/libs/angularjs/1.6.5/angular-route.min.js
wget -nc -nv https://ajax.googleapis.com/ajax/libs/angularjs/1.6.5/angular-animate.min.js

# Make a version of runcommand.sh that doesn't try pipe input from /dev/tty
sed 's/\(eval \$command\).*tty ./\1 \&/gi' \
    /opt/retropie/supplementary/runcommand/runcommand.sh > $SVR/runcommand.sh
chmod 755 $SVR/runcommand.sh

# create a php.ini with bigger upload limits
sed -f - /etc/php5/apache2/php.ini > $WebtroPie/php.ini << SED_SCRIPT
  s|^;*\s*\(upload_max_filesize\s*=\).*$|\1 128M|gi
  s|^;*\s*\(post_max_size\s*=\).*$|\1 128M|gi
  s|^;*\s*\(memory_limit\s*=\).*$|\1 128M|gi
SED_SCRIPT

# create a php.ini for stand alone webserver with altered session settings
sed -f - $WebtroPie/php.ini > $WebtroPie/phpserver.ini << SED_SCRIPT
  s|^;*\s*\(session.name\s*=\).*$|\1 PHPSERVER|gi
  s|^;*\s*\(session.save_path\s*=\).*$|\1 $WebtroPie/sessions|gi
SED_SCRIPT

if [ $apache == "y" ]; then
    # APACHE

    # quick and dirty way to serve from apache http://192.168.?.?/app
    sudo ln -sf "$WebtroPie/app" /var/www/html/app

    # Make a backup php.ini (once)
    if [ ! -s /etc/php5/apache2/php.ini.orig ] ; then
        sudo cp /etc/php5/apache2/php.ini /etc/php5/apache2/php.ini.orig
    fi

    # copy altered php.ini
    sudo cp "$WebtroPie/php.ini" /etc/php5/apache2/php.ini

    # Make a backup envvars (once)
    if [ ! -s /etc/apache2/envvars.orig ] ; then
        sudo cp /etc/apache2/envvars /etc/apache2/envvars.orig
    fi

    # change both APACHE_RUN_USER and APACHE_RUN_GROUP
    # from www-data to pi
    sudo sed 's/\(APACHE_RUN_\(USER\|GROUP\)=\)www-data/\1pi/g' \
        /etc/apache2/envvars.orig > /etc/apache2/envvars
    # try to restart apache but may need a reboot if pid not found
    sudo apachectl restart

    echo "--------------------------------------------------------"
    echo "WebtroPie serving by Apache from ${IP}/app"
    echo "--------------------------------------------------------"

else
    # STAND ALONE PHP WEBSERVER

    cd "$WebtroPie"

    # Create local session directory owned by pi
    if [ ! -d "$WebtroPie/sessions" ] ; then
        mkdir "$WebtroPie/sessions"
        chown pi:www-data "$WebtroPie/sessions"
        chmod 755 "$WebtroPie/sessions"
    fi

    # base for local is / not /app
    sudo sed 's|base href="app"|base href=""|' app/index.html > app/index.php

    # must be run as pi (not root)
    if [ `whoami` != 'pi' ]; then
       echo "to run WebtroPie type :-"
       echo
       echo "./STANDALONE.sh"
    else
       ./STANDALONE.sh
    fi
fi

printf "\nReady\n\e[7m \e[0m\n"

#!/bin/bash

# ------------
# INSTALLATION
# ------------

cd `dirname $0`              # this directory
SVR=app/svr                  # external content (image) to web serve
LIB=app/lib                  # external libs

# Make sure you have the packages below :-

sudo apt-get install apache2 php5 libapache2-mod-php5 php5-gd -y

#  fix permissions ?
sudo sudo chown -R pi:www-data app
sudo find app -type f -exec chmod 664 {} \;
sudo find app -type d -exec chmod 775 {} \;

# create symlinks so we can web serve images and themes from the svr directory
sudo ln -sf /etc/emulationstation/themes                   $SVR
sudo ln -sf /home/pi/.emulationstation/downloaded_images   $SVR
sudo ln -sf /home/pi/RetroPie/roms                         $SVR

# quick and dirty way to serve from apache http://192.168.?.?/app
sudo ln -sf `pwd`/app /var/www/html/app

# download libs so that it can work offline in future
cd $LIB
wget -nc -nv https://ajax.googleapis.com/ajax/libs/angularjs/1.6.5/angular.js
wget -nc -nv https://ajax.googleapis.com/ajax/libs/angularjs/1.6.5/angular.min.js
wget -nc -nv https://ajax.googleapis.com/ajax/libs/angularjs/1.6.5/angular-route.min.js
wget -nc -nv https://ajax.googleapis.com/ajax/libs/angularjs/1.6.5/angular-animate.min.js

IP=`ifconfig | sed '/inet addr:.*255.255/!d;s|.*addr:|http://|;s|\s.*|/app|'`

echo
echo "WebtroPie serving from ${IP}"
printf "\nReady\n\e[7m \e[0m\n"

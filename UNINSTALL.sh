#!/bin/sh

rm -f app/lib/angular*.js
sudo rm app/svr/runcommand.sh
sudo rm app/svr/themes
sudo rm app/svr/downloaded_images
sudo rm app/svr/roms
sudo rm /var/www/html/roms

if [ -s /etc/apache2/envvars.orig ] ; then
   sudo cp /etc/apache2/envvars /etc/apache2/envvars.bak
   sudo mv /etc/apache2/envvars.orig /etc/apache2/envvars
fi


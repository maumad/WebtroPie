#!/bin/bash

# ----------------------------------
# ENABLE REMOTE LAUNCH FUNCTIONALITY
# ----------------------------------

# Note: This changes the apache run user to 'pi'
# and creates a local modified runcommand.sh

cd `dirname $0`              # this directory
SVR=app/svr                  # external content (image) to web serve

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

# Make a version of runcommand.sh that doesn't try pipe input from /dev/tty
sed 's/\(eval \$command\).*tty ./\1 \&/gi' \
   /opt/retropie/supplementary/runcommand/runcommand.sh > $SVR/runcommand.sh

chmod 755 $SVR/runcommand.sh

printf "\nReady\n\e[7m \e[0m\n"

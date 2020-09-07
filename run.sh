#!/bin/sh

echo "#####################################################################"
echo "# WARNING: setting TLS to insecure!"
echo "#          THIS IS UNSAFE! DO NOT DO THIS IN PRODUCTION SYSTEMS"
echo "#"
echo "# cryptogen used in network local generated invalid certs with extension any"
echo "#####################################################################"

export NODE_TLS_REJECT_UNAUTHORIZED=0

unset http_proxy
unset https_proxy

node index

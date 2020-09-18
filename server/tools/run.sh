#!/bin/sh

echo "#####################################################################"
echo "# WARNING: setting TLS to insecure!"
echo "#          THIS IS UNSAFE! DO NOT DO THIS IN PRODUCTION SYSTEMS"
echo "#"
echo "# cryptogen used in network local generated invalid certs with extension any"
echo "#####################################################################"
export NODE_TLS_REJECT_UNAUTHORIZED=0


if [ ! -z "$BSA_DEBUG" ] && [ "$BSA_DEBUG" -eq "1" ]; then
    # export LOG_LEVEL_CONSOLE=${LOG_LEVEL_CONSOLE:-info}
    # export LOG_CONSOLE_STDOUT=${LOG_CONSOLE_STDOUT:-false}

    #export DISCOVERY_AS_LOCALHOST=false
    #export LOG_LEVEL_APP=debug
    #export LOG_LEVEL_DB=debug
    #export LOG_LEVEL_CONSOLE=debug

    export HFC_LOGGING='{"debug":"console","info":"console"}'

    #export GRPC_VERBOSITY="DEBUG"
    #export GRPC_TRACE="all"
fi

unset http_proxy
unset https_proxy

./make_tag.sh || echo "skipped make tag"

npm run start

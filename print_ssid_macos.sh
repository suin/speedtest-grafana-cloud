#!/usr/bin/env zsh
/System/Library/PrivateFrameworks/Apple80211.framework/Resources/airport -I | grep SSID | grep -v BSSID | awk '{ printf "%s", $NF }'

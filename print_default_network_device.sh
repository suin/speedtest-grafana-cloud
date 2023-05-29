#!/usr/bin/env zsh
networksetup -listallhardwareports | grep -C1 $(route get default | grep interface | awk '{print $2}') | grep "Hardware Port" | awk '{printf "%s", $NF}'

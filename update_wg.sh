#!/bin/bash
# Script to update WireGuard configuration without disrupting active connections

WG_CONF="/etc/wireguard/wg0.conf"

# Check if the WireGuard configuration file exists
if [[ -f "$WG_CONF" ]]; then
    sudo wg syncconf wg0 <(sudo wg-quick strip wg0)
else
    echo "Error: Configuration file not found."
    exit 1
fi

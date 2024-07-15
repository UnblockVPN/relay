#!/bin/bash

#####
# Total Steps: 24
# This script automates the setup process for various components including WireGuard, UFW, dnsmasq, PM2, and more.
##### 

# Define dependencies
dependencies=("sse.js" "package.json" "peer.js" "update_wg.sh")

# Check if all dependencies are present
for file in "${dependencies[@]}"; do
    if [ ! -f "$file" ]; then
        echo "Error: $file not found!"
        exit 1
    fi
done

# Set execute permissions on dependencies
for file in "${dependencies[@]}"; do
    chmod +x "$file"
done

# Detect current user and home path
USER=$(whoami)
HOME_PATH="/home/$USER"

### Enable net forwarding
sudo sysctl net.ipv4.ip_forward
sudo sh -c 'echo "net.ipv4.ip_forward=1" > /etc/sysctl.conf'
sudo sysctl -p
sudo sysctl net.ipv4.ip_forward

# Update package lists with alternative DNS server (replace 8.8.8.8 with your preferred DNS server)
echo "# Setting temporary nameserver for package download"
echo "nameserver 8.8.8.8" > /etc/resolv.conf
apt-get update

# Stop and disable systemd-resolved
echo "# Stopping systemd-resolved service"
systemctl stop systemd-resolved
echo "# Disabling systemd-resolved to avoid conflicts"
systemctl disable systemd-resolved

# Install dnsmasq
echo "# Installing dnsmasq for DNS resolution"
apt-get install -y dnsmasq

# Configure dnsmasq (replace with your desired DNS servers)
echo "# Adding desired DNS servers to dnsmasq configuration"
echo "server=8.8.8.8" >> /etc/dnsmasq.conf
echo "server=1.1.1.1" >> /etc/dnsmasq.conf

# Get the hostname using the 'hostname' command
hostname_to_add=$(hostname)

# Add entry to hosts file (replace 'your_domain' with your actual domain name if applicable)
echo "# Adding entry to /etc/hosts for hostname resolution"
echo "127.0.0.1   $hostname_to_add.your_domain" >> /etc/hosts

# Start dnsmasq
echo "# Starting dnsmasq service"
sudo systemctl start dnsmasq

# Verify DNS resolution
ping -c 3 $hostname_to_add

if [ $? -eq 0 ]; then
  echo "DNS resolution working with dnsmasq!"
else
  echo "Warning: DNS resolution failed after installing dnsmasq. Check configuration."
fi

# Install dnsutils
echo "Installing dnsutils and running dig"
sudo apt install -y dnsutils
dig @127.0.0.1 google.com

#### Step 1: Update package list and install necessary packages ####
echo "######  Step 1: Updating package list and installing necessary packages..."

sudo apt update
sudo apt install -y wireguard ufw nodejs npm resolvconf 
npm install

# Pause for 2 seconds
sleep 2

# Step 6: Setup WireGuard
echo "###### Step 6: WireGuard..."

# Ensure the WireGuard directory exists
sudo mkdir -p /etc/wireguard

# Setup the WireGuard configuration file
cat <<EOF | sudo tee /etc/wireguard/wg0.conf
[Interface]
Address = 10.64.0.1/9
PrivateKey = UIydQimUWR0md4GeCg03/Iq0JCK3h380OGzO8u/uflU=
ListenPort = 51820
SaveConfig = false
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o ens4 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o ens4 -j MASQUERADE
MTU = 1360
DNS = 10.64.0.1

[Peer]
PublicKey = bC0bZabVL4iL0K52imrgdWi5TFL0ONe1Ini1NNhNJx4=
AllowedIPs = 10.64.3.3/32

[Peer]
PublicKey = gVZWhtpIq77+wiBBKn8s5YOR2C+IcPEnI9o7f9f5R34=
AllowedIPs = 10.64.3.7/32
EOF

# Enable and start the WireGuard interface
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0

# Pause for 2 seconds
sleep 2

echo "WireGuard setup completed."

#### Step 12: Configure PM2 to start sse.js as sudo and save and restart automatically ####
echo "######  Step 12: Configuring PM2..."
sudo npm install -g pm2
sudo pm2 start sse.js --name="RELAY"
sudo pm2 save
sudo pm2 startup

# Pause for 2 seconds
sleep 2

#!/bin/bash

# Detect current user
TARGET_USER=$(whoami)

# Define the sudoers file path
SUDOERS_FILE="/etc/sudoers.d/$TARGET_USER"

# Ensure the script is running as root
if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root" >&2
    exit 1
fi

# Create the sudoers file if it does not exist
if [ ! -f "$SUDOERS_FILE" ]; then
    echo "Creating sudoers file: $SUDOERS_FILE"
    echo "# Custom sudoers rules for $TARGET_USER" | sudo tee $SUDOERS_FILE > /dev/null
    sudo chmod 0440 $SUDOERS_FILE
fi

# Prepare commands to append without duplicating
{
    echo "$TARGET_USER ALL=(ALL) NOPASSWD: /home/$TARGET_USER/update_wg.sh"
    echo "$TARGET_USER ALL=(ALL) NOPASSWD: /usr/bin/wg, /usr/bin/wg-quick"
    echo "$TARGET_USER ALL=(ALL) NOPASSWD: /bin/cat /etc/wireguard/wg0.conf"
    echo "$TARGET_USER ALL=(ALL) NOPASSWD: /usr/bin/wg syncconf wg0 <(wg-quick strip wg0)"
} | grep -v -f $SUDOERS_FILE | sudo EDITOR='tee -a' visudo -f $SUDOERS_FILE

# Verify the syntax of the new sudoers file
if sudo visudo -c -f $SUDOERS_FILE &>/dev/null; then
    echo "Sudoers file has been updated and verified successfully."
else
    echo "Error: There was a syntax error in the sudoers file which could lock sudo access!" >&2
    exit 2
fi

sudo cat /etc/sudoers.d/$TARGET_USER

# Pause for 2 seconds
sleep 2

# Step 16: Configure iptables   >>>>>>>>>>>>> i dont think we need this redirect rule here
echo "######  Step 16: Configuring iptables..."
sudo iptables -t nat -A PREROUTING -p udp --dport 20000:51820 -j REDIRECT --to-port 51820
sudo iptables -t nat -A POSTROUTING -o ens4 -j MASQUERADE
sudo ip route add 10.0.0.0/9 dev wg0

# Step 17: Save iptables configuration
echo "######  Step 17: Saving iptables configuration..."
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y iptables-persistent
sudo iptables-save | sudo tee /etc/iptables/rules.v4 >/dev/null

# Pause for 2 seconds
sleep 2

# Step 19: Show WireGuard status
echo "######  Step 19: Showing WireGuard status..."
sudo wg show
sudo systemctl status wg-quick@wg0


# Pause for 2 seconds
sleep 2

# Step 20: Show UFW status
echo "######  Step 20: Showing UFW status..."
sudo ufw status verbose

# Pause for 2 seconds
sleep 2

# Step 21: Show dnsmasq status
echo "######  Step 21: Showing dnsmasq status..."
sudo systemctl status dnsmasq --no-pager | head -n 10

# Pause for 2 seconds
sleep 2

# Step 21b: Ping test
echo "Checking network connectivity by pinging google.com..."
if ping -c 4 google.com; then
    echo "Ping to google.com successful."
else
    echo "Failed to ping google.com. Check network connectivity and DNS settings."
fi

# Pause for 2 seconds
sleep 2

# Step 22: Show PM2 status
echo "######  Step 22: Showing PM2 status..."
sudo pm2 status

# Pause for 2 seconds
sleep 2

# Step 23: Show firewall status
echo "######  Step 23: Showing firewall status..."
sudo iptables -L -n -v

# Pause for 2 seconds
sleep 2

# Step 24: Show iptables NAT status
echo "######  Step 24: Showing iptables NAT status..."
sudo iptables -t nat -L -v -n

# Pause for 2 seconds
sleep 2

# Step 25: Print the sudoers file
echo "######  Step 25: Printing the sudoers file..."
sudo cat "$SUDOERS_FILE"

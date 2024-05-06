const fs = require('fs');
const { exec } = require('child_process');
const wgConfigPath = '/etc/wireguard/wg0.conf';

function addPeer(peerData) {
    console.log('Attempting to add a new peer:', peerData);
    const peerConfig = `[Peer]\nPublicKey = ${peerData.pubkey}\nAllowedIPs = ${peerData.ipv4_address}/32\n`;
    
    // Write configuration to file and handle possible errors
    try {
        fs.appendFileSync(wgConfigPath, peerConfig);
        console.log('Configuration written to file successfully.');
    } catch (error) {
        console.error('Failed to write peer configuration to file:', error);
        return;
    }

    // Execute the update script and log the output
    exec('sudo /home/unblockvpnio/update_wg.sh', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing update script: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Error output from update script: ${stderr}`);
            return;
        }
        console.log('Update script executed successfully:', stdout);
    });
}

function removePeer(peerData) {
    console.log('Attempting to remove a peer:', peerData);
    // Read the current configuration and handle errors
    let config;
    try {
        config = fs.readFileSync(wgConfigPath, 'utf8');
    } catch (error) {
        console.error('Failed to read configuration file:', error);
        return;
    }

    const peerConfig = `[Peer]\nPublicKey = ${peerData.pubkey}\nAllowedIPs = ${peerData.ipv4_address}/32`;
    const newConfig = config.replace(peerConfig, '');

    // Write the new configuration to file
    try {
        fs.writeFileSync(wgConfigPath, newConfig);
        console.log('Peer configuration removed from file successfully.');
    } catch (error) {
        console.error('Failed to write new configuration to file:', error);
        return;
    }

    // Execute the update script and log the output
    exec('sudo /home/unblockvpnio/update_wg.sh', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing update script: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Error output from update script: ${stderr}`);
            return;
        }
        console.log('Update script executed successfully:', stdout);
    });
}

// Export the functions
module.exports = {
    addPeer,
    removePeer
};

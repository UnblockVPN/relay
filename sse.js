const fs = require('fs');
const EventSource = require('eventsource');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'events.log' })
    ]
});

const sseUrl = 'https://api.unblockvpn.io/sse/events';
const wgConfigPath = '/etc/wireguard/wg0.conf';

const eventSource = new EventSource(sseUrl);

eventSource.onmessage = event => {
    logger.debug('Raw event data:', event.data);
    try {
        const data = JSON.parse(event.data);
        if (data && data.type) {
            if (data.type.toUpperCase() === 'INSERT') {
                logger.debug(`Event type received: ${data.type}`, data);

                insertPeer(data.data);
            } else if (data.type.toUpperCase() === 'DELETE') {
                deletePeer(data.data);
            }
        }
    } catch (error) {
        logger.error(`Error processing event: ${error.message}`);
    }
};

function insertPeer(peerData) {
    logger.info('Starting to insert peer:', peerData);

    if (!peerData || !peerData.pubkey || !peerData.ipv4_address) {
        logger.error('Invalid peer data received.');
        return;
    }

    try {
        // Log the original configuration for comparison
        const originalConfig = fs.readFileSync(wgConfigPath, 'utf-8');
        logger.debug('Original WireGuard Config:', originalConfig);

        const peerConfig = `\n[Peer]\nPublicKey = ${peerData.pubkey}\nAllowedIPs = ${peerData.ipv4_address}/32\n`;
        fs.appendFileSync(wgConfigPath, peerConfig);

        // Log the new configuration to verify the change
        const updatedConfig = fs.readFileSync(wgConfigPath, 'utf-8');
        logger.debug('Updated WireGuard Config:', updatedConfig);

        logger.info('Inserted new peer:', peerData);
    } catch (error) {
        logger.error('Error inserting peer:', error);
    }
}


function deletePeer(peerData) {
    logger.info('Starting to delete peer:', peerData);

    if (!peerData || !peerData.pubkey || !peerData.ipv4_address) {
        logger.error('Invalid peer data received for deletion:', peerData);
        return;
    }

    try {
        // Log the original configuration for comparison
        let config = fs.readFileSync(wgConfigPath, 'utf-8');
        logger.debug('Original WireGuard Config:', config);

        const peerConfig = `[Peer]\nPublicKey = ${peerData.pubkey}\nAllowedIPs = ${peerData.ipv4_address}/32`;
        const newConfig = config.replace(peerConfig, ''); // Store the modified configuration

        fs.writeFileSync(wgConfigPath, newConfig);

        // Log the new configuration to verify the change
        const updatedConfig = fs.readFileSync(wgConfigPath, 'utf-8');
        logger.debug('Updated WireGuard Config:', updatedConfig);

        logger.info('Deleted peer:', peerData);
    } catch (error) {
        logger.error('Error deleting peer:', error);
    }
}



eventSource.onerror = error => {
    logger.error('SSE connection error:', { message: error.message || error, type: 'SSE Error' });
};

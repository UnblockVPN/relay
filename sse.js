const fs = require('fs');
const EventSource = require('eventsource');
const winston = require('winston');
const axios = require('axios');
const { exponentialBackoff } = require('axios-retry');

// Configure the logger
const logger = winston.createLogger({
    level: 'debug', // Set log level to debug for additional logging
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'events.log' }),
        new winston.transports.File({ filename: 'gateway-errors.log', level: 'error' })
    ]
});

// Axios retry configuration
axios.defaults.retry = 3; // Retry 3 times
axios.defaults.retryDelay = exponentialBackoff; // Use exponential backoff retry strategy

const sseUrl = 'https://api.unblockvpn.io/sse/events';
const wgConfigPath = '/etc/wireguard/wg0.conf';

// Create an Axios instance with retry
const axiosInstance = axios.create();
axiosInstance.defaults.retry = 3;
axiosInstance.defaults.retryDelay = exponentialBackoff;

const eventSource = new EventSource(sseUrl);

eventSource.onmessage = event => {
    try {
        logger.debug('Received message:', event.data); // Log the received message
        const data = JSON.parse(event.data);
        if (data && data.type) {
            if (data.type.toUpperCase() === 'INSERT') {
                logger.debug('Received INSERT event:', data); // Log the received INSERT event
                insertPeer(data.data);
            } else if (data.type.toUpperCase() === 'DELETE') {
                logger.debug('Received DELETE event:', data); // Log the received DELETE event
                deletePeer(data.data);
            }
        }
    } catch (error) {
        logger.error(`Error processing event: ${error.message}`);
    }
};

function insertPeer(peerData) {
    if (!peerData || !peerData.pubkey || !peerData.ipv4_address) {
        logger.error('Invalid peer data received.');
        return;
    }

    const peerConfig = `\n[Peer]\nPublicKey = ${peerData.pubkey}\nAllowedIPs = ${peerData.ipv4_address}/32\n`;
    try {
        fs.appendFileSync(wgConfigPath, peerConfig);
        logger.info('Inserted new peer:', peerData);
    } catch (error) {
        logger.error('Error inserting peer:', error);
    }
}

function deletePeer(peerData) {
    if (!peerData || !peerData.pubkey || !peerData.ipv4_address) {
        logger.error('Invalid peer data received.');
        return;
    }

    try {
        let config = fs.readFileSync(wgConfigPath, 'utf-8');
        const peerConfig = `[Peer]\nPublicKey = ${peerData.pubkey}\nAllowedIPs = ${peerData.ipv4_address}/32`;
        config = config.replace(peerConfig, '');
        fs.writeFileSync(wgConfigPath, config);
        logger.info('Deleted peer:', peerData);
    } catch (error) {
        logger.error('Error deleting peer:', error);
    }
}

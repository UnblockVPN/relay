require('dotenv').config(); // Load environment variables from .env file
const fs = require('fs');
const EventSource = require('eventsource');
const winston = require('winston');
const axios = require('axios');
const { exponentialBackoff } = require('axios-retry');

// Configure the logger
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({ level: 'debug' }),
        new winston.transports.File({ filename: 'events.log' }),
        new winston.transports.File({ filename: 'gateway-errors.log', level: 'error' })
    ]
});


// Axios retry configuration
axios.defaults.retry = 3; // Retry 3 times
axios.defaults.retryDelay = exponentialBackoff; // Use exponential backoff retry strategy

const sseUrl = process.env.API_ENDPOINT; // API endpoint from environment variable
const wgConfigPath = process.env.WG_CONFIG_PATH; // WireGuard config path from environment variable

// Create an Axios instance with retry
const axiosInstance = axios.create();
axiosInstance.defaults.retry = 3;
axiosInstance.defaults.retryDelay = exponentialBackoff;

const eventSource = new EventSource(sseUrl);

eventSource.onmessage = event => {
    try {
        logger.debug('Received message:', event.data); // Log the received message
        const eventData = JSON.parse(event.data);
        logger.debug('Parsed event data:', eventData);
        logger.debug('Keys in eventData:', Object.keys(eventData)); // List all keys

        // Safely access properties
        const name = eventData?.name ?? 'Name Undefined';
        const pubkey = eventData?.pubkey ?? 'Pubkey Undefined';
        const ipv4_address = eventData?.ipv4_address ?? 'IP Undefined';
        const eventType = eventData?.event_type?.toUpperCase() ?? 'UNDEFINED';

        logger.debug(`### Event Details Immediately After Parsing ###`);
        logger.debug(`### Name: ${name}`);
        logger.debug(`### Pubkey: ${pubkey}`);
        logger.debug(`### IP: ${ipv4_address}`);
        logger.debug(`### End of Event Details ###`);

        // Handle known event types
        if (['INSERT', 'DELETE'].includes(eventType)) {
            logger.debug(`Received ${eventType} event:`, eventData);
            eventType === 'INSERT' ? insertPeer(eventData) : deletePeer(eventData);
        } else {
            logger.debug('Received unhandled or unknown event type:', eventType);
        }
    } catch (error) {
        logger.error(`Error processing event: ${error.message}`, { eventData });
    }
};








function insertPeer(peerData) {
    if (!peerData || !peerData.pubkey || !peerData.ipv4_address) {
        logger.error('Invalid peer data received during insertion:', peerData);
        return;
    }

    const { pubkey, ipv4_address } = peerData;
    logger.debug(`Attempting to insert peer with pubkey ${pubkey} and IPv4 address ${ipv4_address}`);

    const peerConfig = `\n[Peer]\nPublicKey = ${pubkey}\nAllowedIPs = ${ipv4_address}/32\n`;
    try {
        fs.appendFileSync(wgConfigPath, peerConfig);
        logger.info('Inserted new peer:', peerData);
    } catch (error) {
        logger.error('Error inserting peer:', error);
    }
}


function deletePeer(peerData) {
    if (!peerData || !peerData.pubkey || !peerData.ipv4_address) {
        logger.error('Invalid peer data received during deletion:', peerData);
        return;
    }

    const { pubkey, ipv4_address } = peerData;
    logger.debug(`Attempting to delete peer with pubkey ${pubkey} and IPv4 address ${ipv4_address}`);

    try {
        let config = fs.readFileSync(wgConfigPath, 'utf-8');
        const peerConfig = `[Peer]\nPublicKey = ${pubkey}\nAllowedIPs = ${ipv4_address}/32`;
        config = config.replace(peerConfig, '');
        fs.writeFileSync(wgConfigPath, config);
        logger.info('Deleted peer:', peerData);
    } catch (error) {
        logger.error('Error deleting peer:', error);
    }
}


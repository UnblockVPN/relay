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
        logger.debug(`### Test ###`);

        const eventData = JSON.parse(event.data);
        logger.debug('Parsed event data:', eventData);  // Add this line to confirm what's parsed

        // Check if eventData contains necessary properties
        if (eventData && eventData.event_type) {
            const eventType = eventData.event_type.toUpperCase();
            logger.debug('Extracted event type:', eventType);

            // Correcting property access based on actual JSON keys
            logger.debug(`### Event Details ###`);
            logger.debug(`### Name: ${eventData.name}`);  // Assuming 'name' is correct and exists
            logger.debug(`### Pubkey: ${eventData.pubkey}`);  // Corrected from eventData.id to eventData.pubkey
            logger.debug(`### IP: ${eventData.ipv4_address}`);  // Assuming 'ipv4_address' is correct and exists
            logger.debug(`### End of Event Details ###`);

            // Handle INSERT event
            if (eventType === 'INSERT') {
                logger.debug('Received INSERT event:', eventData);
                insertPeer(eventData);
            } 
            // Handle DELETE event
            else if (eventType === 'DELETE') {
                logger.debug('Received DELETE event:', eventData);
                deletePeer(eventData);
            } 
            // Log unknown event types
            else {
                logger.debug('Received unknown event type:', eventData);
            }
        } else {
            logger.error('Invalid event-data received:', eventData);
        }
    } catch (error) {
        logger.error(`Error processing event: ${error.message}`);
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


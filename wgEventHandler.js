const EventSource = require('eventsource');
const { readWgConfig } = require('./readFunctions');
const { writeTempWgConfig, applyWgConfig } = require('./writeFunctions');
const winston = require('winston');

// Configure the logger
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'debug.log' })
    ]
});

const sseUrl = 'https://api.unblockvpn.io/sse/events';
const wgConfPath = '/etc/wireguard/wg0.conf';
const tempDir = '/home/unblockvpnio/';
const tempConfigPath = tempDir + 'wg0.conf.update.temp';

logger.debug(`Connecting to SSE URL: ${sseUrl}`);
const eventSource = new EventSource(sseUrl);

eventSource.onmessage = event => {
    try {
        logger.debug('Event received. Starting to process...');
        const data = JSON.parse(event.data);
        logger.debug(`Parsed event data: ${JSON.stringify(data, null, 2)}`);

        if (data.type === 'INSERT') {
            const { ipv4_address, pubkey } = data.data;
            logger.debug(`Processing INSERT event for IP: ${ipv4_address} with pubkey: ${pubkey}`);
            processInsertEvent(ipv4_address, pubkey);
        } else if (data.type === 'DELETE') {
            const { ipv4_address } = data.data;
            logger.debug(`Processing DELETE event for IP: ${ipv4_address}`);
            processDeleteEvent(ipv4_address);
        }
    } catch (error) {
        logger.error(`Error processing event: ${error.message}`);
    }
};

eventSource.onerror = error => {
    logger.error(`EventSource encountered an error: ${JSON.stringify(error, null, 2)}`);
};

function processInsertEvent(ip, pubkey) {
    logger.debug(`Initiating processInsertEvent for IP: ${ip}`);
    readWgConfig(wgConfPath, config => {
        if (!config) {
            logger.error('Failed to read WireGuard configuration for INSERT event.');
            return;
        }
        const updatedConfig = updateConfigWithNewPeer(config, ip, pubkey);
        logger.debug('Updated configuration prepared for INSERT event.');
        writeTempWgConfig(tempConfigPath, updatedConfig);
        applyWgConfig(tempConfigPath);
    });
}

function processDeleteEvent(ip) {
    logger.debug(`Initiating processDeleteEvent for IP: ${ip}`);
    readWgConfig(wgConfPath, config => {
        if (!config) {
            logger.error('Failed to read WireGuard configuration for DELETE event.');
            return;
        }
        const updatedConfig = removePeerFromConfig(config, ip);
        logger.debug('Updated configuration prepared for DELETE event.');
        writeTempWgConfig(tempConfigPath, updatedConfig);
        applyWgConfig(tempConfigPath);
    });
}

function updateConfigWithNewPeer(config, ip, pubkey) {
    logger.debug(`Updating config with new peer: IP - ${ip}, pubkey - ${pubkey}`);
    // Logic to update the configuration with the new peer.
    // Make sure to return the updated configuration.
    return config; // Replace with actual update logic.
}

function removePeerFromConfig(config, ip) {
    logger.debug(`Removing peer from config: IP - ${ip}`);
    // Logic to remove the specified peer from the configuration.
    // Make sure to return the updated configuration.
    return config; // Replace with actual removal logic.
}

// Keep the script running
process.stdin.resume();
logger.debug('Script initialized and running.');

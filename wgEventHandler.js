// File: wgEventHandler.js
const { readWgConfig } = require('./readFunctions');
const { writeTempWgConfig, applyWgConfig } = require('./writeFunctions');
const winston = require('winston');
const util = require('util');
const { exec } = require('child_process');
const { createSemaphore } = require('ws');
const semaphore = createSemaphore(1);
const { initializeSSE, processInsertEvent, processDeleteEvent } = require('./sseHandler');

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

function processInsertEvent(ip, pubkey) {
    try {
        semaphore.acquire();

        readWgConfig((config, error) => {
            if (error) {
                logger.error(`File: wgEventHandler.js: Failed to read WireGuard configuration for INSERT event: ${error}`);
                return;
            }

            if (!config) {
                logger.error('File: wgEventHandler.js: Empty WireGuard configuration for INSERT event.');
                return;
            }

            const updatedConfig = updateConfigWithNewPeer(config, ip, pubkey);
            logger.debug('File: wgEventHandler.js: Updated configuration prepared for INSERT event.');
            writeTempWgConfig(tempConfigPath, updatedConfig);
            applyWgConfig(tempConfigPath);

            semaphore.release();
        });
    } catch (error) {
        logger.error(`File: wgEventHandler.js: Error acquiring semaphore: ${error.message}`);
    }
}

function processDeleteEvent(ip) {
    logger.debug(`File: wgEventHandler.js: Initiating processDeleteEvent for IP: ${ip}`);
    readWgConfig(wgConfPath, config => {
        if (!config) {
            logger.error('File: wgEventHandler.js: Failed to read WireGuard configuration for DELETE event.');
            return;
        }
        const updatedConfig = removePeerFromConfig(config, ip);
        logger.debug('File: wgEventHandler.js: Updated configuration prepared for DELETE event.');
        writeTempWgConfig(tempConfigPath, updatedConfig);
        applyWgConfig(tempConfigPath);
    });
}

function updateConfigWithNewPeer(config, ip, pubkey) {
    logger.debug(`File: wgEventHandler.js: Updating config with new peer: IP - ${ip}, pubkey - ${pubkey}`);

    // Logic to update the configuration with the new peer.
    // Make sure to return the updated configuration.
    // Replace with actual update logic.
    return config; // Replace with actual update logic.
}

function removePeerFromConfig(config, ip) {
    logger.debug(`File: wgEventHandler.js: Removing peer from config: IP - ${ip}`);

    // Logic to remove the specified peer from the configuration.
    // Make sure to return the updated configuration.
    // Replace with actual removal logic.
    return config; // Replace with actual removal logic.
}  

// Initialize SSE
initializeSSE(sseUrl, processInsertEvent, processDeleteEvent);

// Keep the script running
process.stdin.resume();
logger.debug('File: wgEventHandler.js: Script initialized and running.');

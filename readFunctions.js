// File: readFunctions.js
const fs = require('fs');
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
        new winston.transports.File({ filename: 'readFunctions.log' })
    ]
});

/**
 * Reads the WireGuard configuration file.
 * @param {string} configPath - The path to the WireGuard configuration file.
 * @param {Function} callback - The callback function to handle the read configuration.
 */
function readWgConfig(configPath, callback) {
    logger.debug(`Reading WireGuard configuration from: ${configPath}`);
    try {
        fs.readFile(configPath, 'utf8', (error, data) => {
            if (error) {
                logger.error(`Error reading WireGuard configuration: ${error.message}`);
                callback(null);
            } else if (!data) {
                logger.error('Empty configuration file.');
                callback(null);
            } else {
                logger.debug(`WireGuard configuration read successfully.`);
                callback(data);
            }
        });
    } catch (error) {
        logger.error(`Error reading WireGuard configuration: ${error.message}`);
        callback(null);
    }
}


module.exports = {
    readWgConfig
};

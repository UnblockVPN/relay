// File: readFunctions.js
const winston = require('winston');
const { exec } = require('child_process'); // Add this import

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

/**
 * Reads the WireGuard configuration file using 'wg syncconf'.
 * @param {Function} callback - The callback function to handle the read configuration.
 */
function readWgConfig(callback) {
    logger.debug(`Reading WireGuard configuration using 'wg syncconf'`);
    
    // Log the start of the function
    logger.debug('File: readFunctions.js: Start reading WireGuard configuration.');

    exec(`sudo wg syncconf wg0 -`, (error, stdout, stderr) => {
        if (error) {
            // Log the error
            logger.error(`Error reading WireGuard configuration: ${error.message}`);
            callback(null, error); // Pass both null data and error to the callback
        } else if (stderr) {
            // Log the stderr output
            logger.error(`Error reading WireGuard configuration: ${stderr}`);
            callback(null, stderr); // Pass both null data and stderr to the callback
        } else {
            // Log success and data
            logger.debug(`WireGuard configuration read successfully.`);
            logger.debug(`Configuration data: ${stdout}`);
            callback(stdout, null); // Pass the configuration data and null error to the callback
        }

        // Log the end of the function
        logger.debug('File: readFunctions.js: End reading WireGuard configuration.');
    });
}


module.exports = {
    readWgConfig
};

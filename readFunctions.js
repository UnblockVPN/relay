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
        new winston.transports.File({ filename: 'readFunctions.log' })
    ]
});

/**
 * Reads the WireGuard configuration file with sudo.
 * @param {string} configPath - The path to the WireGuard configuration file.
 * @param {Function} callback - The callback function to handle the read configuration.
 */
function readWgConfig(configPath, callback) {
    const command = `sudo cat ${configPath}`;
    logger.debug(`Reading WireGuard configuration using sudo from: ${configPath}`);
    exec(command, (error, stdout, stderr) => {
        if (error) {
            logger.error(`Error reading WireGuard configuration: ${error.message}`);
            callback(null);
        } else if (stderr) {
            logger.error(`Error reading WireGuard configuration: ${stderr}`);
            callback(null);
        } else {
            logger.debug(`WireGuard configuration read successfully.`);
            callback(stdout); // Pass the configuration data to the callback
        }
    });
}

module.exports = {
    readWgConfig
};

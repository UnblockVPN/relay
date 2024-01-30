// File: writeFunctions.js
const fs = require('fs');
const { exec } = require('child_process');
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

/**
 * Writes the temporary WireGuard configuration.
 * @param {string} tempConfigPath - The path to the temporary configuration file.
 * @param {string} config - The configuration data to be written.
 */
function writeTempWgConfig(tempConfigPath, config) {
    logger.debug(`File: writeFunctions.js: Attempting to write configuration to temp file: ${tempConfigPath}`);
    try {
        fs.writeFileSync(tempConfigPath, config, 'utf8');
        logger.debug(`File: writeFunctions.js: Configuration successfully written to temp file.`);
    } catch (error) {
        logger.error(`File: writeFunctions.js: Error writing to temp file: ${error.message}`);
    }
}

/**
 * Applies the WireGuard configuration using the 'wg syncconf' command.
 * @param {string} tempConfigPath - The path to the temporary configuration file.
 */
function applyWgConfig(tempConfigPath) {
    logger.debug(`File: writeFunctions.js: Preparing to execute wg syncconf with temp file: ${tempConfigPath}`);
    exec(`sudo wg syncconf wg0 ${tempConfigPath}`, (error, stdout, stderr) => {
        if (error) {
            logger.error(`File: writeFunctions.js: Error applying wg config: ${error.message}`);
            return;
        }
        if (stderr) {
            logger.error(`File: writeFunctions.js: stderr applying wg config: ${stderr}`);
            return;
        }
        logger.debug(`File: writeFunctions.js: WireGuard configuration applied successfully from ${tempConfigPath}`);
        if (stdout) {
            logger.debug(`File: writeFunctions.js: stdout from wg syncconf: ${stdout}`);
        }
    });
}

module.exports = {
    writeTempWgConfig,
    applyWgConfig
};

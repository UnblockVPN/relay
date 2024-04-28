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

function handleAddPeerEvent(ip, pubkey) {
    try {
        semaphore.acquire();

        readWgConfig((config, error) => {
            if (error) {
                logger.error(`File: newPeerHandler.js: Failed to read WireGuard configuration for ADD_PEER event: ${error}`);
                return;
            }

            if (!config) {
                logger.error('File: wgEventHandler.js: Empty WireGuard configuration for ADD_PEER event.');
                return;
            }

            const updatedConfig = updateConfigWithNewPeer(config, ip, pubkey);
            logger.debug(`File: newPeerHandler.js: Updated configuration prepared for ADD_PEER event.');
            writeTempWgConfig(tempConfigPath, updatedConfig);
            applyWgConfig(tempConfigPath);

            semaphore.release();
        });
    } catch (error) {
        logger.error(`File: newPeerHandler.js: Error acquiring semaphore: ${error.message}`);
    }
}
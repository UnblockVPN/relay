function processAddPeerEvent(ip, pubkey) {
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
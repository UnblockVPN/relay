const http = require('http');
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

function initializeSSE(sseUrl, processInsertEvent, processDeleteEvent) {
    const request = http.request(sseUrl, (response) => {
        response.on('data', (data) => {
            try {
                const parsedData = JSON.parse(data);

                if (parsedData.type === 'INSERT') {
                    const { ipv4_address, pubkey } = parsedData.data;
                    logger.debug(`Processing INSERT event for IP: ${ipv4_address} with pubkey: ${pubkey}`);
                    processInsertEvent(ipv4_address, pubkey);
                } else if (parsedData.type === 'DELETE') {
                    const { ipv4_address } = parsedData.data;
                    logger.debug(`Processing DELETE event for IP: ${ipv4_address}`);
                    processDeleteEvent(ipv4_address);
                }
            } catch (error) {
                logger.error(`Error processing event: ${error.message}`);
            }
        });

        response.on('error', (error) => {
            logger.error(`Error receiving data from server: ${error.message}`);
        });

        response.on('end', () => {
            logger.debug('Connection to server closed.');
        });
    });

    request.end();
}

module.exports = {
    initializeSSE
};

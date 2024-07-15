const fs = require('fs');
const EventSource = require('eventsource');
const winston = require('winston');
const { addPeer, removePeer } = require('./peer.js');


const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'events.log' })
    ]
});

const sseUrl = 'https://api.unblockvpn.io/sse/events';
const wgConfigPath = '/etc/wireguard/wg0.conf';

const eventSource = new EventSource(sseUrl);

eventSource.onmessage = event => {
    logger.debug('Raw event data:', event.data);
    try {
        const parsedData = JSON.parse(event.data);
        logger.debug('Parsed JSON data:', JSON.stringify(parsedData, null, 2));

        // Extract the event_type directly from the nested data object
        const eventType = (parsedData.data && parsedData.data.event_type) ? parsedData.data.event_type.toUpperCase() : 'UNKNOWN';
        logger.debug(`Handling event type: ${eventType}`, { eventData: parsedData.data });

        switch (eventType) {
            case 'INSERT':
                insertPeer(parsedData.data);
                break;
            case 'DELETE':
                deletePeer(parsedData.data);
                break;
            default:
                // This will ignore UPDATE and any other types not explicitly handled
                logger.info(`Ignoring event type: ${eventType}`, { eventData: parsedData.data });
        }
    } catch (error) {
        logger.error(`Error processing event: ${error.message}`, { rawEvent: event.data });
    }
};




function insertPeer(peerData) {
    logger.info('Starting to insert peer:', peerData);

    if (!peerData || !peerData.pubkey || !peerData.ipv4_address) {
        logger.error('Invalid peer data received.');
        return;
    }

    addPeer(peerData, (error) => {
        if (error) {
            logger.error('Error inserting peer:', error);
        } else {
            logger.info('Inserted new peer:', peerData);
        }
    });
}

function deletePeer(peerData) {
    logger.info('Starting to delete peer:', peerData);

    if (!peerData || !peerData.pubkey || !peerData.ipv4_address) {
        logger.error('Invalid peer data received for deletion:', peerData);
        return;
    }

    removePeer(peerData, (error) => {
        if (error) {
            logger.error('Error deleting peer:', error);
        } else {
            logger.info('Deleted peer:', peerData);
        }
    });
}




eventSource.onerror = error => {
    logger.error('SSE connection error:', { message: error.message || error, type: 'SSE Error' });
};
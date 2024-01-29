// wgEventHandler.js
const EventSource = require('eventsource');
const fs = require('fs');
const { exec } = require('child_process');
const winston = require('winston');

// Configure the logger
const logger = winston.createLogger({
    level: 'debug', // Set log level to debug for detailed logging
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
const tempDir = '/home/unblockvpnio/temp/';
const scriptPath = '/home/unblockvpnio/apply_wg_config.sh';

const eventSource = new EventSource(sseUrl);

eventSource.onmessage = event => {
    try {
        const data = JSON.parse(event.data);
        logger.debug(`Received SSE event: ${event.data}`);

        if (data.type === 'INSERT') {
            const { ipv4_address, pubkey } = data.data;
            updateWireGuardConfig(ipv4_address, pubkey);
        } else if (data.type === 'DELETE') {
            const { ipv4_address, pubkey } = data.data;
            deleteWireGuardConfig(ipv4_address, pubkey);
        }
    } catch (error) {
        logger.error(`Error processing event: ${error.message}`);
    }
};

eventSource.onerror = error => {
    logger.error(`EventSource encountered an error: ${error.message}`);
};

function deleteWireGuardConfig(ip, pubkey) {
    logger.debug(`Starting deleteWireGuardConfig for IP: ${ip} and pubkey: ${pubkey}`);
    // ... [Logic for deleting WireGuard config] ...
    const tempConfigPath = `${tempDir}wg0.conf.tmp`;
    // ... [Write to tempConfigPath and handle response] ...
    exec(`sudo ${scriptPath} ${tempConfigPath}`, handleExecResponse);
};

function updateWireGuardConfig(ip, pubkey) {
    logger.debug(`Starting updateWireGuardConfig with IP: ${ip} and pubkey: ${pubkey}`);
    // ... [Logic for updating WireGuard config] ...
    const tempConfigPath = `${tempDir}wg0.conf.tmp`;
    // ... [Write to tempConfigPath and handle response] ...
    exec(`sudo ${scriptPath} ${tempConfigPath}`, handleExecResponse);
};

function handleExecResponse(error, stdout, stderr) {
    if (error) {
        logger.error(`Error executing apply_wg_config script: ${error.message}`);
        return;
    }
    if (stdout) logger.debug(`stdout: ${stdout}`);
    if (stderr) logger.debug(`stderr: ${stderr}`);
    logger.debug('WireGuard configuration applied successfully');
}

// Keep the script running
process.stdin.resume();
logger.debug('Script initialized and running.');


const { exec } = require('child_process');

function addPeer(peerData, callback) {
    const command = `sudo wg set wg0 peer ${peerData.pubkey} allowed-ips ${peerData.ipv4_address}/32`;
    exec(command, (error, stdout, stderr) => {
        if (error || stderr) {
            callback(error || new Error(stderr));
        } else {
            callback(null);
        }
    });
}

function removePeer(peerData, callback) {
    const command = `sudo wg set wg0 peer ${peerData.pubkey} remove`;
    exec(command, (error, stdout, stderr) => {
        if (error || stderr) {
            callback(error || new Error(stderr));
        } else {
            callback(null);
        }
    });
}


module.exports = { addPeer, removePeer };

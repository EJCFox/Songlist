const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');
const WebSocket = require('../common/websocketMessage');

const usersTableName = process.env.usersTableName;
const songListTableName = process.env.songListTableName;

exports.handler = async event => {
    console.info('Queue get request received', event);

    const { connectionId } = event.requestContext;
    const userRecord = await Dynamo.get({ ID: connectionId }, usersTableName);
    const { domainName, stage } = userRecord;

    const songItems = await Dynamo.getAll(songListTableName);

    await WebSocket.send({
        domainName,
        stage,
        connectionId,
        data: {
            action: 'listGet',
            data: songItems.map((item) => ({
                id: item.ID,
                title: item.Title,
                artist: item.Artist
            }))
        },
    });

    return Responses._200({ message: 'successfully sent songs'});
};

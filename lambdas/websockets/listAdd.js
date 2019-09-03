const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');
const WebSocket = require('../common/websocketMessage');
const { v4: uuidv4 } = require('uuid');

const usersTableName = process.env.usersTableName;
const songListTableName = process.env.songListTableName;

exports.handler = async event => {
    const { connectionId } = event.requestContext;
    const body = JSON.parse(event.body);

    if (!body.name) {
        return Responses._400({ message: 'Song name must be specified' });
    }
    if (!body.artist) {
        return Responses._400({ message: 'Song artist must be specified' });
    }

    const userRecord = await Dynamo.get(connectionId, usersTableName);
    const { domainName, stage } = userRecord;

    const newSong = {
        ID: uuidv4(),
        Name: body.name,
        Artist: body.artist
    };

    await Dynamo.write(newSong, songListTableName);

    await WebSocket.send({
        domainName,
        stage,
        connectionId,
        message: 'Song added to list',
    });

    return Responses._200({ message: 'song added' });
};

const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');
const { broadcast } = require('../helpers/broadcast');

const songListTableName = process.env.songListTableName;
const songQueueTableName = process.env.songQueueTableName;
const songHistoryTableName = process.env.songHistoryTableName;

exports.handler = async event => {
    console.info('Queue remove request received', event);
    const body = JSON.parse(event.body);

    if (!body.songId) {
        return Responses._400({ message: 'Song ID must be specified' });
    }

    try {
        await Dynamo.delete({ SongID: body.songId }, songQueueTableName, 'attribute_exists(SongID)');
    } catch (error) {
        console.info(`Song with ID ${body.songId} not found in queue`, error);
        return Responses._404({ message: `Song with ID ${body.songId} not found in queue` });
    }
    
    if (body.songPlayed) {
        const timestamp = (new Date()).toISOString();
        const songItem = await Dynamo.get({ ID: body.songId }, songListTableName);
        const updatedSongItem = {
            ...songItem,
            NumberOfPlays: songItem.NumberOfPlays + 1,
            LastPlayed: timestamp
        };
        const historyItem = {
            SongID: body.songId,
            Timestamp: timestamp
        };
        await Dynamo.write(updatedSongItem, songListTableName, `NumberOfPlays = ${songItem.NumberOfPlays}`);
        await Dynamo.write(historyItem, songHistoryTableName);
    }

    await broadcast({ action: 'queueRemove', data: {
        songId: body.songId,
        songPlayed: !!body.songPlayed,
    }});
    return Responses._200({ message: 'song removed' });
};

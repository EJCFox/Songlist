const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');
const { broadcast } = require('../helpers/broadcast');

const songListTableName = process.env.songListTableName;
const songQueueTableName = process.env.songQueueTableName;

exports.handler = async event => {
    console.info('Queue add request received', event);
    const body = JSON.parse(event.body);

    if (!body.songId) {
        return Responses._400({ message: 'Song ID must be specified' });
    }

    let songItem;
    try {
        songItem = await Dynamo.get({ ID: body.songId }, songListTableName);
    } catch (error) {
        return Responses._404({ message: `Song with ID ${body.songId} not found` });
    }

    if (await Dynamo.exists({ SongID: body.songId }, songQueueTableName)) {
        return Responses._400({ message: 'Song already queued' });
    }

    const existingQueueItems = (await Dynamo.getAll(songQueueTableName)).sort((a, b) => a.Priority - b.Priority);
    const newQueueEntry = {
        SongID: body.songId,
        Artist: songItem.Artist,
        Title: songItem.Title,
        Priority: existingQueueItems.length ? existingQueueItems[existingQueueItems.length - 1].Priority + 1 : 1
    };

    await Dynamo.write(newQueueEntry, songQueueTableName);
    await broadcast({ action: 'queueAdd', data: {
        songId: newQueueEntry.SongID,
        artist: newQueueEntry.Artist,
        title: newQueueEntry.Title,
        priority: newQueueEntry.Priority,
    }});
    
    return Responses._200({ message: 'song added' });
};

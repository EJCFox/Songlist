const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');
const WebSocket = require('../common/websocketMessage');
const { v4: uuidv4 } = require('uuid');
const { broadcast } = require('../helpers/broadcast');

const songListTableName = process.env.songListTableName;

exports.handler = async event => {
    console.info('Song add request received', event);

    const body = JSON.parse(event.body);

    if (!body.title) {
        return Responses._400({ message: 'Song title must be specified' });
    }
    if (!body.artist) {
        return Responses._400({ message: 'Song artist must be specified' });
    }

    const matchedSongs = await Dynamo.search(
        '(Artist = :artist) and (Title = :title)',
        { ':artist': body.artist, ':title': body.title },
        songListTableName);
    console.debug('Matched songs', matchedSongs);
    if (matchedSongs.length > 0) {
        return Responses._400({ message: 'Song already exists' });
    }

    const newSongEntry = {
        ID: uuidv4(),
        Title: body.title,
        Artist: body.artist,
        Tags: body.tags && Array.isArray(body.tags) && body.tags.length && body.tags.every(tag => typeof tag === 'string')
            ? JSON.stringify(body.tags)
            : JSON.stringify([]),
        NumberOfPlays: 0
    };

    console.debug('Writing song entry', newSongEntry);
    await Dynamo.write(newSongEntry, songListTableName);

    await broadcast({
        action: 'listAdd',
        data: {
            id: newSongEntry.ID,
            title: newSongEntry.Title,
            artist: newSongEntry.Artist
        }
    });

    return Responses._200({ message: 'song added' });
};

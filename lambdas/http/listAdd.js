const { v4: uuidv4 } = require('uuid');
const response = require('../helpers/apiResponses');
const dynamo = require('../helpers/dynamo');
const validation = require('../helpers/parameterValidation');
const websocket = require('../helpers/websocket');
const { isAdminRequest } = require('../helpers/adminHelper');

const songListTableName = process.env.songListTableName;

exports.handler = async (event) => {
  console.info('List add request received', event);

  if (!(await isAdminRequest(event))) {
    return response.unauthorized({
      message: 'Unauthorized: only admins can add songs to the list',
    });
  }

  const body = JSON.parse(event.body);

  if (!validation.isRequiredString(body.title)) {
    return response.badRequest({ message: 'Invalid title' });
  }

  if (!validation.isRequiredString(body.artist)) {
    return response.badRequest({ message: 'Invalid artist' });
  }

  const matchedSongs = await dynamo.search(
    '(Artist = :artist) and (Title = :title)',
    { ':artist': body.artist, ':title': body.title },
    songListTableName
  );
  console.debug('Matched songs', matchedSongs);
  if (matchedSongs.length > 0) {
    console.debug('Matched songs', matchedSongs);
    return response.badRequest({ message: 'Song already exists' });
  }

  const newDynamoEntry = {
    ID: uuidv4(),
    Title: body.title,
    Artist: body.artist,
    NumberOfPlays: 0,
  };
  console.debug('Writing song entry', newDynamoEntry);
  await dynamo.write(newDynamoEntry, songListTableName);

  const songData = {
    id: newDynamoEntry.ID,
    title: newDynamoEntry.Title,
    artist: newDynamoEntry.Artist,
    numberOfPlays: newDynamoEntry.NumberOfPlays,
  };
  console.debug('Song added', songData);

  await websocket.broadcast({
    action: 'listAdd',
    data: songData,
  });
  return response.success(songData);
};

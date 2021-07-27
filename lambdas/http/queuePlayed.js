const response = require('../helpers/apiResponses');
const dynamo = require('../helpers/dynamo');
const websocket = require('../helpers/websocket');
const validation = require('../helpers/parameterValidation');
const { isAdminRequest } = require('../helpers/adminHelper');

const songListTableName = process.env.songListTableName;
const songQueueTableName = process.env.songQueueTableName;
const songHistoryTableName = process.env.songHistoryTableName;

exports.handler = async (event) => {
  console.info('Queue mark song as played request received', event);

  if (!(await isAdminRequest(event))) {
    return response.unauthorized({
      message: 'Unauthorized: only admins can mark songs as played',
    });
  }

  const songId = event.pathParameters.songId;
  if (!validation.isValidId(songId)) {
    return response.badRequest({ message: 'Invalid song ID' });
  }

  const timestamp = new Date().toISOString();
  const songItem = await dynamo.get({ ID: songId }, songListTableName);

  try {
    await dynamo.delete(
      { SongID: songId },
      songQueueTableName,
      'attribute_exists(SongID)'
    );
  } catch (error) {
    return response.notFound({ message: 'Song not currently queued' });
  }

  const updatedSongItem = {
    ...songItem,
    NumberOfPlays: songItem.NumberOfPlays + 1,
    LastPlayed: timestamp,
  };
  const historyItem = {
    SongID: songId,
    Timestamp: timestamp,
  };

  console.info('Updating song list entry', songItem, updatedSongItem);
  await dynamo.write(
    updatedSongItem,
    songListTableName,
    `NumberOfPlays = :numberOfPlays`,
    { ':numberOfPlays': songItem.NumberOfPlays }
  );
  console.info('Writing history entry', historyItem);
  await dynamo.write(historyItem, songHistoryTableName);

  await websocket.broadcast({
    action: 'queuePlayed',
    data: {
      songId: songId,
      title: updatedSongItem.Title,
      artist: updatedSongItem.Artist,
      numberOfPlays: updatedSongItem.NumberOfPlays,
      lastPlayed: updatedSongItem.LastPlayed,
    },
  });
  return response.successNoContent;
};

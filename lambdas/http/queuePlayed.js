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

  const songItem = await dynamo.get({ ID: songId }, songListTableName);

  const timestamp = new Date().toISOString();
  const updatedSongItem = {
    ...songItem,
    NumberOfPlays: songItem.NumberOfPlays + 1,
    LastPlayed: timestamp,
  };
  const historyItem = {
    SongID: songId,
    title: songItem.Title,
    artist: songItem.Artist,
    Timestamp: timestamp,
  };

  try {
    await dynamo.transactWrite(
      {
        Delete: {
          TableName: songQueueTableName,
          Key: { SongID: songId },
          ConditionExpression: 'attribute_exists(SongID)',
        },
      },
      {
        Put: {
          TableName: songListTableName,
          Item: updatedSongItem,
          ConditionExpression: `NumberOfPlays = :numberOfPlays`,
          ExpressionAttributeValues: {
            ':numberOfPlays': songItem.NumberOfPlays,
          },
        },
      },
      {
        Put: {
          TableName: songHistoryTableName,
          Item: historyItem,
        },
      }
    );
  } catch (error) {
    if (
      error.code === 'TransactionCanceledException' ||
      error.statusCode === 400
    ) {
      console.error('Failed to write updates:', error);
      return response.badRequest({
        message:
          'Cannot mark song as played, most likely because the song is not in the queue',
      });
    }
    throw error;
  }

  console.debug('Written updated song:', updatedSongItem);
  console.debug('Written history entry:', historyItem);

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

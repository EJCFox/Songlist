const responses = require('../helpers/apiResponses');
const dynamo = require('../helpers/dynamo');

const songQueueTableName = process.env.songQueueTableName;

exports.handler = async (event) => {
  console.info('Queue get request received', event);
  const queueItems = await dynamo.getAll(songQueueTableName);
  return responses.success(
    queueItems.map((item) => ({
      songId: item.SongID,
      title: item.Title,
      artist: item.Artist,
      priority: item.Priority,
    }))
  );
};

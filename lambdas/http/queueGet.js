const Responses = require('../helpers/API_Responses');
const Dynamo = require('../helpers/Dynamo');

const songQueueTableName = process.env.songQueueTableName;

exports.handler = async (event) => {
  console.info('Queue get request received', event);
  const queueItems = await Dynamo.getAll(songQueueTableName);
  return Responses._200(
    queueItems.map((item) => ({
      songId: item.SongID,
      title: item.Title,
      artist: item.Artist,
      priority: item.Priority,
    }))
  );
};

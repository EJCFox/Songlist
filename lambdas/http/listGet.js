const response = require('../helpers/apiResponses');
const dynamo = require('../helpers/dynamo');

const songListTableName = process.env.songListTableName;

exports.handler = async (event) => {
  console.info('Queue get request received', event);
  const songItems = await dynamo.getAll(songListTableName);
  return response.success(
    songItems.map((item) => ({
      id: item.ID,
      title: item.Title,
      artist: item.Artist,
      numberOfPlays: item.NumberOfPlays,
      lastPlayed: item.LastPlayed ? item.LastPlayed : null,
    }))
  );
};

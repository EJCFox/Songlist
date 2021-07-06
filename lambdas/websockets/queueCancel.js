const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { broadcast } = require("../helpers/broadcast");

const songQueueTableName = process.env.songQueueTableName;

exports.handler = async (event) => {
  console.info("Queue cancel request received", event);
  const body = JSON.parse(event.body);

  if (!body.songId) {
    return Responses._400({ message: "Song ID must be specified" });
  }

  try {
    const oldValue = await Dynamo.delete(
      { SongID: body.songId },
      songQueueTableName,
      "attribute_exists(SongID)",
      "ALL_OLD"
    );
    console.info("Deleted:", oldValue);

    await broadcast({
      action: "queueCancel",
      data: {
        songId: body.songId,
        title: oldValue.Attributes.Title,
        artist: oldValue.Attributes.Artist,
      },
    });
  } catch (error) {
    console.info(`Song with ID ${body.songId} not found in queue`, error);
    return Responses._404({
      message: `Song with ID ${body.songId} not found in queue`,
    });
  }

  return Responses._200({ message: "song removed from queue" });
};

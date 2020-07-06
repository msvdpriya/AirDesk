import AWS from "aws-sdk";
import { globalConfig } from "@airtable/blocks";

export async function detectSentiment(text) {
  const REGION = globalConfig.get("awsRegion");
  const ACCESS_KEY = globalConfig.get("accessKey");
  const SECRET_KEY = globalConfig.get("secretKey");
  AWS.region = REGION;
  AWS.config.update({
    region: REGION,
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  });
  const comprehend = new AWS.Comprehend();
  if (!text) {
    return;
  }
  console.log(text);
  const params = {
    LanguageCode: "en",
    Text: text,
  };
  const sentimentPromise = comprehend.detectSentiment(params).promise();

  const [sentiment] = await Promise.all([sentimentPromise]);

  return {
    sentiment: sentiment,
  };
}

export async function detectTags(text) {
  const REGION = globalConfig.get("awsRegion");
  const ACCESS_KEY = globalConfig.get("accessKey");
  const SECRET_KEY = globalConfig.get("secretKey");
  AWS.region = REGION;
  AWS.config.update({
    region: REGION,
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  });
  if (!text) {
    return;
  }
  const comprehend = new AWS.Comprehend();
  console.log(text);
  const params = {
    LanguageCode: "en",
    Text: text,
  };
  const tagsPromise = comprehend.detectKeyPhrases(params).promise();

  const [tags] = await Promise.all([tagsPromise]);

  return {
    tags: tags,
  };
}

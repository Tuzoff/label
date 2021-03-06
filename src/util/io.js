import axios from 'axios';
import { parseString } from 'xml2js';
import { S3_BUCKET_URL, LABEL_CONFIG_FILE_URL } from '../constants';

/**
 * Generates an array of image object URLs from our S3 Bucket representation.
 *
 * @param {object} xml2js AWS S3 bucket object representation
 * @return {array}
 */
const extractImageListFromBucket = bucket => {
  const list = [];
  const jsonList = [];
  const nameList = [];
  const bucketContents = bucket.ListBucketResult.Contents;
  bucketContents.forEach(object => {
    const fileName = object.Key[0];

    // filter out everything except web images
    if (/\.(gif|jpg|jpeg|png|bmp)$/.test(fileName)) {
      list.push(`${fileName}`);
      nameList.push(`${fileName.replace(/\.(gif|jpg|jpeg|png|bmp)$/, '')}`);
    }
    if (/\.(json)$/.test(fileName)) {
      jsonList.push(`${fileName.replace(/.json/, '')}`);
    }
  });

  return { list, jsonList, nameList };
};

/**
 * Returns the absolute URL, prefixed with our Bucket URL, give a file name
 *
 * @param {string} fileName
 * @return {string}
 */
const getAbsoluteFileUrlFromFileName = fileName => {
  if (
    fileName === LABEL_CONFIG_FILE_URL ||
    fileName.startsWith(S3_BUCKET_URL)
  ) {
    return fileName;
  } else {
    return S3_BUCKET_URL + '/' + fileName;
  }
};

/**
 * Retrieves a list of objects within our AWS S3 bucket.
 *
 * @param {function} onListReady(list) called when the list (array) is ready
 * @return {void}
 */
export const getBucketImageList = onListReady => {
  axios
    .get(`${S3_BUCKET_URL}/?list-type=2`)
    .then(response => {
      parseString(response.data, (error, result) => {
        if (error) {
          alert(error);
        } else {
          onListReady(extractImageListFromBucket(result));
        }
      });
    })
    .catch(error => alert(error));
};

/**
 * Uploads the given JSON as a file to our S3 bucket
 *
 * @param {string} fileName
 * @param {string} json
 * @param {function} [onUploaded]
 */
export const uploadJSONToBucket = (fileName, json, onUploaded) => {
  const fileContents = JSON.stringify(json);
  const blob = new Blob([fileContents], { type: 'application/json' });

  axios
    .put(getAbsoluteFileUrlFromFileName(fileName), blob, {
      headers: {
        'Content-Type': 'application/json',
        'x-amz-acl': 'bucket-owner-full-control'
      }
    })
    .then(response => typeof onUploaded === 'function' && onUploaded())
    .catch(error => alert(error));
};

/**
 * Downloads given file from our S3 bucket
 *
 * @param {string} fileName
 * @param {function} [onDownloaded]
 * @param {function} [onError]
 */
export const downloadJSONFromBucket = (fileName, onDownloaded, onError) => {
  axios
    .get(getAbsoluteFileUrlFromFileName(fileName))
    .then(
      response =>
        typeof onDownloaded === 'function' && onDownloaded(response.data)
    )
    .catch(
      error =>
        (typeof onError === 'function' ? onError(error) : console.log(error))
    );
};

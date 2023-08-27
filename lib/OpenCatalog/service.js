'use strict';

const https = require('https');
const parseString = require('xml2js').parseString;
const IcecatProduct = require('./product');

/**
 *
 * @param instance
 */
const openCatalog = function(instance) {
  this.icecat = instance || {};
  this.https = https;
  this.parseString = parseString;
};

/**
 * GetProduct
 * @param lang
 * @param GTIN
 * @param accessToken
 * @returns {Promise}
 */
openCatalog.prototype.getProduct = function(lang, GTIN, accessToken) {
  const httpRequestUrl = this._getBaseUrl(lang) + ';ean_upc=' + GTIN;

  return this._requestProduct(httpRequestUrl, accessToken);
};

/**
 * GetProductById
 *
 * @param {string} lang
 * @param {integer} productId
 */
openCatalog.prototype.getProductById = function(lang, productId) {
  const httpRequestUrl = this._getBaseUrl(lang) + ';product_id=' + productId;

  return this._requestProduct(httpRequestUrl);
};

/**
 * getProductBySKU
 *
 * Fetch product information by vendor + sku
 *
 * @param {string} lang
 * @param {string} brand
 * @param {string} sku
 */
openCatalog.prototype.getProductBySKU = function(lang, brand, sku) {
  const httpRequestUrl = this._getBaseUrl(lang) + ';prod_id=' + sku + ';vendor=' + brand;

  return this._requestProduct(httpRequestUrl);
};

/**
 * getProductByXMLdata
 *
 * Fetch product information by XML data
 *
 * @param {string} xmlData
 */
openCatalog.prototype.getProductByXMLdata = function(xmlData) {
  return this._getProductByXMLdata(xmlData);
};

/**
 * _getProductByXMLdata
 *
 * Fetch product information by XML data
 *
 * @param {string} xmlData
 * @param {string} httpRequestUrl
 */
openCatalog.prototype._getProductByXMLdata = function(xmlData, httpRequestUrl) {
  return new Promise((resolve, reject) => {
    this.parseString(xmlData, (err, jsonData) => {
      if (err) {
        return reject(err);
      }

      return resolve(new IcecatProduct(jsonData, xmlData, httpRequestUrl));
    });
  });
};

/**
 * Create base url.
 *
 * @param {string} lang
 */
openCatalog.prototype._getBaseUrl = function(lang) {
  return `${this.icecat.scheme}${this.icecat.httpAuth}@${this.icecat.httpUrl}?lang=${lang};output=productxml`;
};

/**
 * Fetch the product by the http request url.
 *
 * @param httpRequestUrl
 * @returns {Promise}
 */
openCatalog.prototype._requestProduct = function(httpRequestUrl, accessToken) {
  return new Promise((resolve, reject) => {
    const url = new URL(httpRequestUrl)
    const options = {
      path: `${url.pathname}${url.search}`,
      hostname: url.hostname,
      headers: {
        "Api-Token": accessToken
      }
    }
    const request = this.https.get(options, (response) => {
      let body = '';

      response.on('data', (chunk) => {
        body += chunk;
      });

      response.on('end', () => {
        return resolve(this._getProductByXMLdata(body, httpRequestUrl));
      });
    });

    request.on('error', (err) => {
      reject(err);
    });
  });
};

module.exports = openCatalog;

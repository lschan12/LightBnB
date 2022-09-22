const { Pool } = require("pg");
const properties = require('./json/properties.json');
const users = require('./json/users.json');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithEmail = (email) => {
  return pool.query(`
  SELECT *
  FROM users
  WHERE email = $1;
  `, [email])
    .then((res) => {
      if (res.rows.length > 0) {
        return res.rows[0];
      } else {
        return null;
      }
    });
};

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithId = (id) => {
  return pool.query(`
  SELECT *
  FROM users
  WHERE id = $1;
  `, [id])
    .then((res) => {
      return res.rows[0];
    });
};

exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */

const addUser = (user) => {
  return pool.query(`
  INSERT INTO users (name, email, password)
  VALUES ($1, $2, $3)
  RETURNING *;
  `, [user.name, user.email, user.password])
    .then((res) => {
      return res.rows[0];
    });
};

exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
// const getAllReservations = function(guest_id, limit = 10) {
//   return getAllProperties(null, 2);
// }

const getAllReservations = (id, limit = 10) => {
  return pool.query(`
  SELECT reservations.*, properties.*
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  WHERE reservations.guest_id = $1
  LIMIT $2;
  `, [id, limit])
    .then((res) => {
      return res.rows;
    });
};

exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = (options, limit = 10) => {
  const queryParams = [];
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  WHERE 1=1
  `;
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `
    AND city LIKE $${queryParams.length}
    `;
  }
  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += `
    AND owner_id = $${queryParams.length}
    `;
  }
  if (options.minimim_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimim_price_per_night * 100, options.maximum_price_per_night * 100);
    queryString += `
    AND cost_per_night >= $${queryParams.length - 1}
    AND cost_per_night <= $${queryParams.length} 
    `;
  }
  queryString += `
  GROUP BY properties.id
  `;
  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `
    HAVING avg(property_reviews.rating) >= $${queryParams.length}
    `;
  }
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;
  return pool.query(queryString,queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
  
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
// const addProperty = function(property) {
//   const propertyId = Object.keys(properties).length + 1;
//   property.id = propertyId;
//   properties[propertyId] = property;
//   return Promise.resolve(property);
// }

const addProperty = (property) => {
  let queryParams = [];
  for (let key in property) {
    queryParams.push(property[key]);
  }
  return pool.query(`
  INSERT INTO properties (
    title, description, number_of_bedrooms, number_of_bathrooms, parking_spaces,
    cost_per_night, thumbnail_photo_url, cover_photo_url, street, country, city,
    province, post_code, owner_id
  )
  VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
  )
  RETURNING *;
  `, queryParams)
    .then((res) => {
      return res.rows[0];
    });
};

exports.addProperty = addProperty;

const mysql = require('mysql2');
const connection = require('../config/db');  

function validateSchoolData(data) {
  if (!data.name || !data.address || !data.latitude || !data.longitude) {
    return 'All fields (name, address, latitude, longitude) are required.';
  }
  if (typeof data.name !== 'string' || typeof data.address !== 'string') {
    return 'Name and address must be strings.';
  }
  if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
    return 'Latitude and longitude must be numbers.';
  }
  return null;
}

const addSchool = (req, res) => {
  const schoolData = req.body;
  const validationError = validateSchoolData(schoolData);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }
  const { name, address, latitude, longitude } = schoolData;
  const query = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
  connection.query(query, [name, address, latitude, longitude], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'An error occurred while adding the school.' });
    }
    res.status(201).json({ message: 'School added successfully!', schoolId: results.insertId });
  });
};


// Haversine formula to calculate distance in kilometers
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
const listSchools = (req, res) => {
    const { latitude, longitude } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);
    if (isNaN(userLat) || isNaN(userLon)) {
      return res.status(400).json({ error: 'Latitude and longitude must be valid numbers' });
    }
    const query = 'SELECT * FROM schools';
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch schools' });
      }
      const schoolsWithDistance = results.map((school) => {
        const distance = getDistanceFromLatLonInKm(userLat, userLon, school.latitude, school.longitude);
        return { ...school, distance };
      });
      schoolsWithDistance.sort((a, b) => a.distance - b.distance);
      res.json(schoolsWithDistance);
    });
};
  
module.exports = { addSchool,listSchools };

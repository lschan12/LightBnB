SELECT DISTINCT reservations.id, properties.title as title, cost_per_night, start_date, avg(property_reviews.rating) as average_rating
FROM properties
JOIN reservations ON properties.id = property_id
JOIN property_reviews ON reservation_id = reservations.id
WHERE reservations.guest_id = 4
GROUP BY reservations.id, properties.title, cost_per_night
ORDER BY start_date
LIMIT 10;
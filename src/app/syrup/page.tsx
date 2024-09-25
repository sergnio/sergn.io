import styles from "./syrup.module.css";

type Syrup = {
  name: string;
  rating?: number;
  reason: string;
  price?: number;
  location: string;
  image: string;
};

const NO_RATING = "??";

const syrups: Syrup[] = [
  {
    name: "Sweet Ontario",
    rating: 5,
    reason: `I didn't know the incredible wonders of pure maple syrup before trying this. It has the perfect maple syrup flavor without the 
    disgusting taste of sweetners. It's maple syrup in its purest form.`,
    price: 7.99,
    location: "Actual Canada",
    image: "syrup/sweet_ontario_canada.jpg",
  },
  {
    name: "Hidden Springs",
    rating: 4,
    reason: `A bit darker, and a bit too sweet. It's drastically sweet compared to Sweet Ontario, but decent maple syrup. Probably wouldn't recommend over other types`,
    price: 9.99,
    location: "Amazon",
    image: "syrup/hidden_springs_amazon.jpg",
  },
  {
    name: "Skluzaceks",
    rating: 4.25,
    reason: `A bit darker, a bit sweet, like the Hidden Springs. It's a local farm so this has bonus points, but still is lacking the pure maple syrup taste like S.O.`,
    price: 18,
    location: "320th Street, New Prague",
    image: "syrup/skluzaceks.jpg",
  },
  {
    name: "Wild Country",
    rating: 4.25,
    reason: `A bit darker, a bit sweet, like the Hidden Springs. It's a local farm so this has bonus points, but still is lacking the pure maple syrup taste like S.O.`,
    price: 18,
    location: "320th Street, New Prague",
    image: "syrup/wild_country.jpg",
  },
  {
    name: "Hamel",
    reason: `Never tasted! I'm curious because Jake says it's good!`,
    location: NO_RATING,
    image: "syrup/hamel_jakes_house.jpg",
  },
];

const sortByRating = (a, b) => b.rating - a.rating;

// todo - covert away from table, use "card" format instead
export default () => (
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Rating</th>
        <th>Reason</th>
        <th>Price</th>
        <th>Location</th>
        <th>Image</th>
      </tr>
    </thead>
    <tbody>
      {syrups.length === 0 && (
        <tr>
          <td colSpan={4}>No syrups found</td>
        </tr>
      )}
      {syrups
        .sort(sortByRating)
        .map(({ name, rating, reason, price, location, image }, index) => (
          <tr key={index}>
            <td>{name}</td>
            <td>{rating ?? NO_RATING}</td>
            <td>{reason}</td>
            <td>{price ?? NO_RATING}</td>
            <td>{location}</td>
            <td>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={`${name} image`}
                className={styles.syrupImage}
              />
            </td>
          </tr>
        ))}
    </tbody>
  </table>
);

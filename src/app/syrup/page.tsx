import styles from "./syrup.module.css";

type Syrup = {
  name: string;
  rating: number;
  reason: string;
  price: number;
  location: string;
  image: string;
};

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
            <td>{rating}</td>
            <td>{reason}</td>
            <td>{price}</td>
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

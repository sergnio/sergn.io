import styles from "./syrup.module.css";

type Syrup = {
  name: string;
  reason: string;
  rating?: number;
  cost?: {
    price: number;
    liters: number;
  };
  location: string;
  image: string;
};

const NO_RATING = "??";

const syrups: Syrup[] = [
  {
    name: "Sweet Ontario",
    rating: 5,
    reason: `I didn't know the incredible wonders of pure maple syrup before trying this. It has the perfect maple syrup flavor without the disgusting taste of sweeteners. It's maple syrup in its purest form.`,
    cost: {
      price: 7.99,
      liters: 3,
    },
    location: "Actual Canada",
    image: "syrup/sweet_ontario_canada.jpg",
  },
  {
    name: "Hidden Springs",
    rating: 4,
    reason: `A bit darker, and a bit too sweet. It's drastically sweet compared to Sweet Ontario, but decent maple syrup. Probably wouldn't recommend over other types.`,
    cost: {
      price: 7.99,
      liters: 3,
    },
    location: "Amazon",
    image: "syrup/hidden_springs_amazon.jpg",
  },
  {
    name: "Skluzaceks",
    rating: 4.55,
    reason: `A bit darker, a bit sweet, like the Hidden Springs. It's a local farm so this has bonus points, but still is lacking the pure maple syrup taste like S.O.`,
    cost: {
      price: 7.99,
      liters: 2,
    },
    location: "320th Street, New Prague",
    image: "syrup/skluzaceks.jpg",
  },
  {
    name: "Wild Country",
    cost: {
      price: 7.99,
      liters: 0.25,
    },
    reason: `Quite good! Bit darker too, and not super sweet. This is quality pure maple syrup.`,
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

const sortByRating = (a: Syrup, b: Syrup): number =>
  (b.rating ?? 0) - (a.rating ?? 0);

const calculatePricePerLiter = ({ cost }: Pick<Syrup, "cost">) =>
  cost?.price ? `$${Number(cost.price / cost.liters).toFixed(2)}` : NO_RATING;

export default () => (
  <div className={styles.syrupContainer}>
    {syrups.length === 0 ? (
      <p>No syrups found</p>
    ) : (
      syrups
        .sort(sortByRating)
        .map(({ name, rating, reason, cost, location, image }, index) => (
          <div key={index} className={styles.syrupCard}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={`${name} image`}
              className={styles.syrupImage}
            />
            <div className={styles.syrupDetails}>
              <h1>{name}</h1>
              <p>
                <strong>Rating:</strong> {rating ?? NO_RATING}
              </p>
              <p>
                <strong>Reason:</strong> {reason}
              </p>
              <p>
                <strong>Price/Liter:</strong> {calculatePricePerLiter({ cost })}
              </p>
              <p>
                <strong>Location:</strong> {location}
              </p>
            </div>
          </div>
        ))
    )}
  </div>
);

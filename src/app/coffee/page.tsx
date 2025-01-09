import styles from "./coffee.module.css";
import Image from "next/image";

const Grinders = {
  manual: "Manual",
  niche: "Niche Zero",
};

type BagSize = { oz: number } | { g: number };

type BrewMethod = "Moka Pot" | "Filter" | "v60" | "Espresso";

type Grinder =
  | {
      name: (typeof Grinders)["manual"];
      number: number;
      rotations: number;
    }
  | {
      name: (typeof Grinders)["niche"];
      setting: number;
    };

type Coffee = {
  name: string;
  boughtFrom: string;
  price: number;
  bagSize: BagSize;
  brewMethod: {
    name: BrewMethod;
    grinder: Grinder;
  }[];
  image: string;
};

const coffees: Coffee[] = [
  {
    name: "Colombia Perky",
    boughtFrom: "Avo Coffee Roasters",
    price: 19.99,
    bagSize: {
      g: 250,
    },
    brewMethod: [
      {
        name: "Moka Pot",
        grinder: {
          name: Grinders["manual"],
          number: 4,
          rotations: 1,
        },
      },
      {
        name: "Filter",
        grinder: {
          name: Grinders["manual"],
          number: 2,
          rotations: 1,
        },
      },
    ],
    image: "/coffee/ethiopian_yirgacheffe.jpg",
  },
];

const calculatePricePerOunce = (price: number, bagSize: BagSize) =>
  `$${(price / ("oz" in bagSize) ? 16 : 1000).toFixed(2)}`;

export default () => (
  <div className={styles.coffeeContainer}>
    {coffees.length === 0 ? (
      <p>No coffees found</p>
    ) : (
      coffees.map(
        (
          { name, boughtFrom, price, grindSetting, grinderUsed, image },
          index,
        ) => (
          <div key={index} className={styles.coffeeCard}>
            <Image
              src={image}
              alt={`${name} image`}
              width={200}
              height={200}
              className={styles.coffeeImage}
            />
            <div className={styles.coffeeDetails}>
              <h1>{name}</h1>
              <p>
                <strong>Bought From:</strong> {boughtFrom}
              </p>
              <p>
                <strong>Price:</strong> ${price.toFixed(2)} (
                {calculatePricePerOunce(price)}/oz)
              </p>
              <p>
                <strong>Optimal Grind Setting:</strong> {grindSetting}
              </p>
              <p>
                <strong>Grinder Used:</strong> {grinderUsed}
              </p>
            </div>
          </div>
        ),
      )
    )}
  </div>
);

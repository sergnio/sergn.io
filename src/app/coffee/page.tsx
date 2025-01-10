import styles from "./coffee.module.css";

const Grinders = {
  manual: "Manual",
  niche: "Niche Zero",
} as const;

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
    price: 15.43,
    bagSize: {
      g: 250,
    },
    brewMethod: [
      {
        name: "Moka Pot",
        grinder: {
          name: Grinders.manual,
          number: 4,
          rotations: 1,
        },
      },
      {
        name: "Filter",
        grinder: {
          name: Grinders.manual,
          number: 2,
          rotations: 1,
        },
      },
    ],
    image: "/coffee/perky.jpg",
  },
];

const isOunceBag = (bagSize: BagSize): bagSize is { oz: number } =>
  "oz" in bagSize;

const formatPriceWithUnit = (price: number, bagSize: BagSize): string => {
  const weight = isOunceBag(bagSize) ? bagSize.oz : bagSize.g / 250;
  const unit = isOunceBag(bagSize) ? "oz" : "250g";
  const pricePerUnit = (price / weight).toFixed(2);

  return pricePerUnit === price.toFixed(2)
    ? `/${unit}`
    : ` ($${pricePerUnit}/${unit})`;
};
export default () => (
  <div className={styles.coffeeContainer}>
    {coffees.length === 0 ? (
      <p>No coffees found</p>
    ) : (
      coffees.map(
        ({ name, boughtFrom, price, bagSize, brewMethod, image }, index) => (
          <div key={index} className={styles.coffeeCard}>
            <img
              src={image}
              alt={`${name} image`}
              className={styles.coffeeImage}
            />
            <div className={styles.coffeeDetails}>
              <h1>{name}</h1>
              <p>
                <strong>Bought From:</strong> {boughtFrom}
              </p>
              <p>
                <strong>Price:</strong> ${price.toFixed(2)}
                <span className={styles.weight}>
                  {formatPriceWithUnit(price, bagSize)}
                </span>
              </p>
              <div>
                <strong>Brew Methods:</strong>
                {brewMethod.map(({ name, grinder }, i) => (
                  <div key={i} className={styles.brewMethod}>
                    <p>
                      <strong>Method:</strong> {name}
                    </p>
                    <p>
                      <strong>Grinder:</strong> {grinder.name}
                    </p>
                    {grinder.name === Grinders.manual && (
                      <>
                        <p>
                          <strong>Number:</strong> {grinder.number}
                        </p>
                        <p>
                          <strong>Rotations:</strong> {grinder.rotations}
                        </p>
                      </>
                    )}
                    {grinder.name === Grinders.niche && (
                      <p>
                        <strong>Setting:</strong> {grinder.setting}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ),
      )
    )}
  </div>
);

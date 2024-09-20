type Syrup = {
  name: string;
  rating: number;
  price: number;
  location: string;
  image: any;
};

const syrups: Syrup[] = [
  {
    name: "Maple",
    rating: 4.5,
    price: 7.99,
    location: "??",
    image: "syrup/sweetOntario.png",
  },
];

export default () => {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Rating</th>
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
        {syrups.map(
          ({ name, rating, price, location, image, image2 }, index) => (
            <tr key={index}>
              <td>{name}</td>
              <td>{rating}</td>
              <td>{price}</td>
              <td>{location}</td>
              <td>
                <img src={image} alt={`${name} image`} />
              </td>
            </tr>
          ),
        )}
      </tbody>
    </table>
  );
};

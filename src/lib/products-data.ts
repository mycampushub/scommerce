export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  reviews: number
  badge?: string
  category: string
  description?: string
  sizes?: string[]
  colors?: string[]
}

export const allProducts: Product[] = [
  // Sarees
  {
    id: '1',
    name: 'Embroidered Silk Saree',
    price: 189.99,
    originalPrice: 249.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/02_5.jpg?v=1775455849',
    rating: 4.5,
    reviews: 128,
    badge: 'Sale',
    category: 'Sarees',
    description: 'Elegant embroidered silk saree perfect for weddings and special occasions',
    sizes: ['One Size'],
    colors: ['Maroon', 'Red', 'Blue', 'Green']
  },
  {
    id: '2',
    name: 'Banarasi Silk Saree',
    price: 349.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/01_5.jpg?v=1775455849',
    rating: 4.9,
    reviews: 201,
    badge: 'Best Seller',
    category: 'Sarees',
    description: 'Traditional Banarasi silk saree with intricate gold and silver zari work',
    sizes: ['One Size'],
    colors: ['Golden', 'Red', 'Pink', 'Purple']
  },
  {
    id: '3',
    name: 'Royal Blue Silk Saree',
    price: 279.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/02_5.jpg?v=1775455849',
    rating: 4.7,
    reviews: 45,
    category: 'Sarees',
    description: 'Beautiful royal blue silk saree with designer pallu',
    sizes: ['One Size'],
    colors: ['Blue', 'Pink', 'Green']
  },
  {
    id: '4',
    name: 'Chiffon Party Wear Saree',
    price: 129.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/06.jpg?v=1775455849',
    rating: 4.4,
    reviews: 87,
    badge: 'New',
    category: 'Sarees',
    description: 'Lightweight chiffon saree perfect for parties and events',
    sizes: ['One Size'],
    colors: ['Black', 'White', 'Pink', 'Navy']
  },
  {
    id: '5',
    name: 'Georgette Designer Saree',
    price: 159.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/01_5.jpg?v=1775455849',
    rating: 4.6,
    reviews: 112,
    category: 'Sarees',
    description: 'Stunning georgette saree with contemporary designs',
    sizes: ['One Size'],
    colors: ['Orange', 'Yellow', 'Teal']
  },

  // Lehengas
  {
    id: '6',
    name: 'Designer Lehenga Choli',
    price: 299.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/05_5.jpg?v=1775455849',
    rating: 4.8,
    reviews: 89,
    badge: 'New',
    category: 'Lehengas',
    description: 'Beautiful designer lehenga choli with intricate embroidery',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Red', 'Pink', 'Maroon']
  },
  {
    id: '7',
    name: 'Velvet Lehenga',
    price: 529.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/05_5.jpg?v=1775455849',
    rating: 4.9,
    reviews: 23,
    badge: 'Premium',
    category: 'Lehengas',
    description: 'Luxurious velvet lehenga perfect for wedding ceremonies',
    sizes: ['S', 'M', 'L'],
    colors: ['Royal Blue', 'Red', 'Black']
  },
  {
    id: '8',
    name: 'Bridal Lehenga',
    price: 899.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/05_5.jpg?v=1775455849',
    rating: 5.0,
    reviews: 45,
    badge: 'Premium',
    category: 'Lehengas',
    description: 'Exquisite bridal lehenga with heavy embroidery and stone work',
    sizes: ['S', 'M', 'L'],
    colors: ['Red', 'Maroon', 'Pink']
  },
  {
    id: '9',
    name: 'Festive Lehenga',
    price: 229.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/05_5.jpg?v=1775455849',
    rating: 4.5,
    reviews: 67,
    badge: 'Sale',
    category: 'Lehengas',
    description: 'Festive lehenga with mirror work and sequins',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Multi', 'Orange', 'Pink']
  },

  // Salwar Suits
  {
    id: '10',
    name: 'Cotton Salwar Suit',
    price: 79.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/03_5.jpg?v=1775455849',
    rating: 4.3,
    reviews: 156,
    category: 'Salwar Suits',
    description: 'Comfortable cotton salwar suit for everyday wear',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Blue', 'Pink', 'Yellow', 'Green']
  },
  {
    id: '11',
    name: 'Palazzo Suit Set',
    price: 119.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/04_5.jpg?v=1775455849',
    rating: 4.4,
    reviews: 94,
    category: 'Salwar Suits',
    description: 'Stylish palazzo suit set with printed design',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Navy', 'Maroon']
  },
  {
    id: '12',
    name: 'Designer Anarkali Suit',
    price: 199.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/04_5.jpg?v=1775455849',
    rating: 4.7,
    reviews: 78,
    badge: 'New',
    category: 'Salwar Suits',
    description: 'Elegant Anarkali suit with heavy embroidery',
    sizes: ['S', 'M', 'L'],
    colors: ['Red', 'Pink', 'Gold']
  },
  {
    id: '13',
    name: 'Churidar Suit Set',
    price: 89.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/03_5.jpg?v=1775455849',
    rating: 4.5,
    reviews: 123,
    category: 'Salwar Suits',
    description: 'Classic churidar suit set for casual occasions',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Beige', 'Pink']
  },

  // Kurtis/Kurtas
  {
    id: '14',
    name: 'Embroidered Kurti',
    price: 89.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/03_5.jpg?v=1775455849',
    rating: 4.4,
    reviews: 112,
    category: 'Kurtas',
    description: 'Beautiful embroidered kurti with contemporary design',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Blue', 'Pink', 'Yellow']
  },
  {
    id: '15',
    name: 'Long Straight Kurti',
    price: 69.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/03_5.jpg?v=1775455849',
    rating: 4.3,
    reviews: 89,
    category: 'Kurtas',
    description: 'Long straight kurti perfect for casual wear',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Black', 'Navy']
  },
  {
    id: '16',
    name: 'A-Line Kurti',
    price: 79.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/03_5.jpg?v=1775455849',
    rating: 4.5,
    reviews: 67,
    badge: 'Sale',
    category: 'Kurtas',
    description: 'Flattering A-line kurti with beautiful prints',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Multi', 'Pink', 'Green']
  },
  {
    id: '17',
    name: 'Designer Kaftan',
    price: 149.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/03_5.jpg?v=1775455849',
    rating: 4.6,
    reviews: 45,
    badge: 'New',
    category: 'Kurtas',
    description: 'Stylish designer kaftan for a trendy look',
    sizes: ['S', 'M', 'L'],
    colors: ['Black', 'Blue', 'Purple']
  },

  // Menswear
  {
    id: '18',
    name: 'Wedding Sherwani',
    price: 459.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/02_5.jpg?v=1775455849',
    rating: 4.8,
    reviews: 67,
    badge: 'New',
    category: 'Menswear',
    description: 'Elegant wedding sherwani with intricate embroidery',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Cream', 'Navy']
  },
  {
    id: '19',
    name: 'Classic Kurta Pyjama',
    price: 89.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/02_5.jpg?v=1775455849',
    rating: 4.4,
    reviews: 134,
    category: 'Menswear',
    description: 'Comfortable kurta pyjama set for everyday wear',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['White', 'Black', 'Blue']
  },
  {
    id: '20',
    name: 'Nehru Jacket',
    price: 129.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/02_5.jpg?v=1775455849',
    rating: 4.6,
    reviews: 56,
    category: 'Menswear',
    description: 'Stylish Nehru jacket perfect for formal occasions',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Maroon', 'Black', 'Cream']
  },
  {
    id: '21',
    name: 'Pathani Suit',
    price: 109.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/02_5.jpg?v=1775455849',
    rating: 4.5,
    reviews: 78,
    category: 'Menswear',
    description: 'Classic Pathani suit for a traditional look',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'White', 'Gray']
  },

  // Gowns
  {
    id: '22',
    name: 'Designer Gown',
    price: 389.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/06.jpg?v=1775455849',
    rating: 4.6,
    reviews: 38,
    category: 'Gowns',
    description: 'Elegant designer gown for special occasions',
    sizes: ['S', 'M', 'L'],
    colors: ['Red', 'Black', 'Blue']
  },
  {
    id: '23',
    name: 'Evening Gown',
    price: 329.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/06.jpg?v=1775455849',
    rating: 4.7,
    reviews: 52,
    badge: 'New',
    category: 'Gowns',
    description: 'Beautiful evening gown with contemporary design',
    sizes: ['S', 'M', 'L'],
    colors: ['Black', 'Navy', 'Emerald']
  },
  {
    id: '24',
    name: 'Cotton Anarkali Dress',
    price: 149.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/04_5.jpg?v=1775455849',
    rating: 4.5,
    reviews: 78,
    category: 'Gowns',
    description: 'Comfortable cotton Anarkali dress for casual wear',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Pink', 'Blue', 'Yellow']
  },
  {
    id: '25',
    name: 'Festive Gown',
    price: 279.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/06.jpg?v=1775455849',
    rating: 4.8,
    reviews: 34,
    badge: 'Sale',
    category: 'Gowns',
    description: 'Festive gown with heavy embroidery',
    sizes: ['S', 'M', 'L'],
    colors: ['Maroon', 'Gold', 'Purple']
  },

  // Tops
  {
    id: '26',
    name: 'Embroidered Crop Top',
    price: 49.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/03_5.jpg?v=1775455849',
    rating: 4.3,
    reviews: 67,
    category: 'Tops',
    description: 'Stylish embroidered crop top for modern look',
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Pink', 'White', 'Black']
  },
  {
    id: '27',
    name: 'Peplum Top',
    price: 59.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/03_5.jpg?v=1775455849',
    rating: 4.4,
    reviews: 89,
    badge: 'New',
    category: 'Tops',
    description: 'Elegant peplum top with beautiful design',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Blue', 'Yellow', 'Red']
  },
  {
    id: '28',
    name: 'Printed Tunic Top',
    price: 54.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/03_5.jpg?v=1775455849',
    rating: 4.5,
    reviews: 112,
    category: 'Tops',
    description: 'Comfortable printed tunic top for casual wear',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Multi', 'Pink', 'Green']
  },
  {
    id: '29',
    name: 'Off-Shoulder Top',
    price: 64.99,
    image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/03_5.jpg?v=1775455849',
    rating: 4.6,
    reviews: 45,
    badge: 'Sale',
    category: 'Tops',
    description: 'Trendy off-shoulder top for parties',
    sizes: ['S', 'M', 'L'],
    colors: ['Black', 'Red', 'White']
  },
]

export const getProductsByCategory = (category: string): Product[] => {
  return allProducts.filter(product => product.category.toLowerCase() === category.toLowerCase())
}

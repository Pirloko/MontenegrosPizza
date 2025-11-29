export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'PIZZAS' | 'EMPANADAS' | 'SANDWICH' | 'BEBESTIBLES';
  isVegetarian?: boolean;
}

export const products: Product[] = [
  // PIZZAS
  {
    id: 'pizza-1',
    name: 'CHURRASQUITO',
    description: 'Pizza con Churrasco, Queso Mozzarella, Tomate y Salsa Palta.',
    price: 16900,
    image: '/images/pizza.jpg',
    category: 'PIZZAS'
  },
  {
    id: 'pizza-2',
    name: 'NAPOLITANA',
    description: 'Salsa de tomate, Mozzarella, Tomate fresco, Ajo y Albahaca.',
    price: 14900,
    image: '/images/pizza_mitades.jpg',
    category: 'PIZZAS',
    isVegetarian: true
  },
  {
    id: 'pizza-3',
    name: 'MECHADA BBQ',
    description: 'Carne mechada, Salsa BBQ, Mozzarella, Cebolla caramelizada.',
    price: 17900,
    image: '/images/pizza.jpg',
    category: 'PIZZAS'
  },

  // EMPANADAS
  {
    id: 'empanada-1',
    name: 'PINO TRADICIONAL',
    description: 'Carne molida, Cebolla, Huevo, Aceituna, Pasas.',
    price: 2500,
    image: '/images/completos.jpg',
    category: 'EMPANADAS'
  },
  {
    id: 'empanada-2',
    name: 'QUESO CAMARÓN',
    description: 'Camarones salteados, Queso Mozzarella, Cebolla.',
    price: 2900,
    image: '/images/completos.jpg',
    category: 'EMPANADAS'
  },
  {
    id: 'empanada-3',
    name: 'NAPOLITANA',
    description: 'Queso Mozzarella, Tomate, Albahaca.',
    price: 2300,
    image: '/images/completos.jpg',
    category: 'EMPANADAS',
    isVegetarian: true
  },

  // SANDWICH
  {
    id: 'sandwich-1',
    name: 'CHURRASCO ITALIANO',
    description: 'Churrasco, Palta, Tomate, Mayonesa casera.',
    price: 7900,
    image: '/images/sandwich.jpg',
    category: 'SANDWICH'
  },
  {
    id: 'sandwich-2',
    name: 'BARROS LUCO',
    description: 'Churrasco, Queso Mozzarella derretido.',
    price: 7500,
    image: '/images/sandwich.jpg',
    category: 'SANDWICH'
  },
  {
    id: 'sandwich-3',
    name: 'VEGETARIANO',
    description: 'Champiñones, Palta, Lechuga, Tomate, Mayonesa vegana.',
    price: 6900,
    image: '/images/sandwich.jpg',
    category: 'SANDWICH',
    isVegetarian: true
  },

  // BEBESTIBLES
  {
    id: 'bebida-1',
    name: 'COCA-COLA',
    description: 'Bebida 350ml',
    price: 1500,
    image: '/images/completos.jpg',
    category: 'BEBESTIBLES'
  },
  {
    id: 'bebida-2',
    name: 'JUGO NATURAL',
    description: 'Naranja, Frutilla o Piña 500ml',
    price: 2500,
    image: '/images/completos.jpg',
    category: 'BEBESTIBLES'
  },
  {
    id: 'bebida-3',
    name: 'CERVEZA ARTESANAL',
    description: 'Variedades locales 350ml',
    price: 3500,
    image: '/images/completos.jpg',
    category: 'BEBESTIBLES'
  }
];
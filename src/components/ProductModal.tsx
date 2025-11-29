import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { X, Plus, Minus } from 'lucide-react';
import { Database } from '../types/database';
import { ingredientService } from '../services/ingredientService';

type Product = Database['public']['Tables']['products']['Row'];
type ExtraIngredient = Database['public']['Tables']['extra_ingredients']['Row'];

interface ProductModalProps {
  show: boolean;
  onHide: () => void;
  product: Product;
  onAddToCart: (product: Product, customizations: ProductCustomization) => void;
}

interface ProductCustomization {
  quantity: number;
  removedIngredients: string[];
  addedIngredients: ExtraIngredient[];
  specialInstructions: string;
}

const defaultIngredients = {
  'PIZZAS': ['Queso Mozzarella', 'Salsa de Tomate', 'Orégano'],
  'EMPANADAS': ['Masa Casera', 'Pino', 'Cebolla'],
  'SANDWICH': ['Pan Artesanal', 'Lechuga', 'Tomate', 'Mayonesa'],
  'BEBESTIBLES': []
};

const ingredientesSinCosto = [
  'Choclo',
  'Aceituna',
  'Pimentón',
  'Palmitos',
  'Jamón',
  'Cebolla Morada'
];

const ingredientesPremium = {
  'Choricillo': 800,
  'Salame': 800,
  'Peperoni': 800,
  'Tocino': 800,
  'Cebolla Caramelizada': 800,
  'Queso Philadelphia': 800,
  'Piña': 800
};

const PRECIO_INGREDIENTE_EXTRA = 500;
const MAX_INGREDIENTES_SIN_COSTO = 3;

const ProductModal: React.FC<ProductModalProps> = ({ show, onHide, product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [selectedIngredientesSinCosto, setSelectedIngredientesSinCosto] = useState<string[]>([]);
  const [selectedIngredientesPremium, setSelectedIngredientesPremium] = useState<string[]>([]);
  const [ingredientesExtra, setIngredientesExtra] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (newIngredient.trim()) {
      setIngredientesExtra([...ingredientesExtra, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const toggleIngredienteSinCosto = (ingredient: string) => {
    if (selectedIngredientesSinCosto.includes(ingredient)) {
      setSelectedIngredientesSinCosto(
        selectedIngredientesSinCosto.filter(i => i !== ingredient)
      );
    } else if (selectedIngredientesSinCosto.length < MAX_INGREDIENTES_SIN_COSTO) {
      setSelectedIngredientesSinCosto([...selectedIngredientesSinCosto, ingredient]);
    }
  };

  const toggleIngredientePremium = (ingredient: string) => {
    if (selectedIngredientesPremium.includes(ingredient)) {
      setSelectedIngredientesPremium(
        selectedIngredientesPremium.filter(i => i !== ingredient)
      );
    } else {
      setSelectedIngredientesPremium([...selectedIngredientesPremium, ingredient]);
    }
  };

  const toggleIngredient = (ingredient: string) => {
    if (removedIngredients.includes(ingredient)) {
      setRemovedIngredients(removedIngredients.filter(i => i !== ingredient));
    } else {
      setRemovedIngredients([...removedIngredients, ingredient]);
    }
  };

  const calcularPrecioExtra = () => {
    const precioPremium = selectedIngredientesPremium.reduce((total, ing) => total + ingredientesPremium[ing], 0);
    const precioExtra = ingredientesExtra.length * PRECIO_INGREDIENTE_EXTRA;
    return precioPremium + precioExtra;
  };

  const handleSubmit = () => {
    const extraPrice = calcularPrecioExtra();
    onAddToCart(product, {
      quantity,
      removedIngredients,
      addedIngredients: [
        ...selectedIngredientesSinCosto,
        ...selectedIngredientesPremium,
        ...ingredientesExtra
      ],
      specialInstructions,
      extraPrice
    });
    onHide();
    // Resetear el estado
    setQuantity(1);
    setRemovedIngredients([]);
    setSelectedIngredientesSinCosto([]);
    setSelectedIngredientesPremium([]);
    setIngredientesExtra([]);
    setSpecialInstructions('');
  };

  const formatPrice = (price: number) => `$${price.toLocaleString()}`;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="h5">{product.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4">
        <div className="row">
          <div className="col-md-6">
            <img
              src={product.image}
              alt={product.name}
              className="img-fluid rounded-3 mb-3"
              style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }}
            />
          </div>
          <div className="col-md-6">
            <p className="text-muted mb-3">{product.description}</p>
            <p className="fw-bold text-success mb-3">{formatPrice(product.price)}</p>
          </div>
        </div>

        {/* Cantidad */}
        <div className="mb-4">
          <h6 className="fw-bold mb-3">Cantidad:</h6>
          <div className="d-flex align-items-center">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => quantity > 1 && setQuantity(quantity - 1)}
            >
              <Minus size={16} />
            </Button>
            <span className="mx-4 fw-bold">{quantity}</span>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>

        {/* Ingredientes base */}
        {defaultIngredients[product.category]?.length > 0 && (
          <div className="mb-4">
            <h6 className="fw-bold mb-3">Ingredientes base:</h6>
            <div className="d-flex flex-wrap gap-2">
              {defaultIngredients[product.category].map((ingredient, index) => (
                <Button
                  key={index}
                  variant={removedIngredients.includes(ingredient) ? 'danger' : 'success'}
                  size="sm"
                  onClick={() => toggleIngredient(ingredient)}
                  className="d-flex align-items-center"
                >
                  {removedIngredients.includes(ingredient) ? (
                    <><X size={14} className="me-1" /> Sin {ingredient}</>
                  ) : (
                    ingredient
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Ingredientes sin costo extra */}
        <div className="mb-4">
          <h6 className="fw-bold mb-3">
            Ingredientes sin costo extra (máximo {MAX_INGREDIENTES_SIN_COSTO}):
          </h6>
          {selectedIngredientesSinCosto.length >= MAX_INGREDIENTES_SIN_COSTO && (
            <Alert variant="warning" className="mb-2">
              Has alcanzado el máximo de ingredientes sin costo permitidos
            </Alert>
          )}
          <div className="d-flex flex-wrap gap-2">
            {ingredientesSinCosto.map((ingredient, index) => (
              <Button
                key={index}
                variant={selectedIngredientesSinCosto.includes(ingredient) ? 'success' : 'outline-success'}
                size="sm"
                onClick={() => toggleIngredienteSinCosto(ingredient)}
                disabled={!selectedIngredientesSinCosto.includes(ingredient) && 
                         selectedIngredientesSinCosto.length >= MAX_INGREDIENTES_SIN_COSTO}
              >
                {ingredient}
              </Button>
            ))}
          </div>
        </div>

        {/* Ingredientes premium */}
        <div className="mb-4">
          <h6 className="fw-bold mb-3">Ingredientes premium:</h6>
          <div className="d-flex flex-wrap gap-2">
            {Object.entries(ingredientesPremium).map(([ingredient, precio], index) => (
              <Button
                key={index}
                variant={selectedIngredientesPremium.includes(ingredient) ? 'success' : 'outline-success'}
                size="sm"
                onClick={() => toggleIngredientePremium(ingredient)}
                className="d-flex align-items-center"
              >
                {ingredient} (+{formatPrice(precio)})
              </Button>
            ))}
          </div>
        </div>

        {/* Ingredientes extra con costo */}
        <div className="mb-4">
          <h6 className="fw-bold mb-3">Agregar otros ingredientes (+{formatPrice(PRECIO_INGREDIENTE_EXTRA)} c/u):</h6>
          <Form onSubmit={handleAddIngredient} className="mb-2">
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="Escribe el ingrediente extra que deseas"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
              />
              <Button type="submit" variant="success">
                <Plus size={16} />
              </Button>
            </div>
          </Form>
          {ingredientesExtra.length > 0 && (
            <div className="d-flex flex-wrap gap-2 mt-2">
              {ingredientesExtra.map((ingredient, index) => (
                <Button
                  key={index}
                  variant="outline-success"
                  size="sm"
                  onClick={() => setIngredientesExtra(ingredientesExtra.filter((_, i) => i !== index))}
                  className="d-flex align-items-center"
                >
                  {ingredient} <X size={14} className="ms-1" />
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Instrucciones especiales */}
        <div className="mb-4">
          <h6 className="fw-bold mb-3">Instrucciones especiales:</h6>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Ej: Sin sal, bien cocido, cortar en 8 porciones, etc."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
          />
        </div>

        {/* Resumen de precio */}
        <div className="mb-4">
          <h6 className="fw-bold mb-2">Resumen:</h6>
          <div className="d-flex justify-content-between">
            <span>Precio base:</span>
            <span>{formatPrice(product.price)}</span>
          </div>
          {calcularPrecioExtra() > 0 && (
            <div className="d-flex justify-content-between text-success">
              <span>Ingredientes adicionales:</span>
              <span>+{formatPrice(calcularPrecioExtra())}</span>
            </div>
          )}
          <div className="d-flex justify-content-between fw-bold mt-2">
            <span>Total por unidad:</span>
            <span>{formatPrice(product.price + calcularPrecioExtra())}</span>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button 
          variant="success" 
          onClick={handleSubmit}
          style={{ backgroundColor: '#0B6E4F', border: 'none' }}
        >
          Agregar al carrito - {formatPrice((product.price + calcularPrecioExtra()) * quantity)}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductModal;
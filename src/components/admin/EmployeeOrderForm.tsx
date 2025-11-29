import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Alert, 
  Modal, 
  Badge,
  InputGroup,
  Spinner
} from 'react-bootstrap';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  User, 
  Phone, 
  MapPin, 
  CreditCard,
  Search,
  X,
  CheckCircle,
  Map
} from 'lucide-react';
import { productService } from '../../services/productService';
import { ingredientService } from '../../services/ingredientService';
import { categoryService } from '../../services/categoryService';
import { orderService } from '../../services/orderService';
import { Database } from '../../types/database';
import { CartItem } from '../../types/index';
import AddressMapPicker from '../AddressMapPicker';
import { useAuth } from '../../context/AuthContext';

type Product = Database['public']['Tables']['products']['Row'];
type ExtraIngredient = Database['public']['Tables']['extra_ingredients']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface EmployeeOrderFormProps {
  onOrderCreated: () => void;
}

export default function EmployeeOrderForm({ onOrderCreated }: EmployeeOrderFormProps) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [extraIngredients, setExtraIngredients] = useState<ExtraIngredient[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customizations, setCustomizations] = useState({
    removedIngredients: [] as string[],
    addedIngredients: [] as ExtraIngredient[],
    specialInstructions: ''
  });

  // Formulario de cliente
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    deliveryType: 'pickup' as 'delivery' | 'pickup',
    deliveryAddress: '',
    notes: ''
  });
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData, ingredientsData] = await Promise.all([
        productService.getAll(),
        categoryService.getActive(),
        ingredientService.getAll()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setExtraIngredients(ingredientsData);
      
      // Seleccionar la primera categoría por defecto si hay categorías
      if (categoriesData.length > 0 && !selectedCategory) {
        setSelectedCategory(categoriesData[0].id);
      }
    } catch (err: any) {
      setError('Error al cargar productos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos por categoría y búsqueda
  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Verificar si un producto es un bebestible
  const isBeverage = (product: Product | null): boolean => {
    if (!product || !product.category_id) return false;
    const category = categories.find(cat => cat.id === product.category_id);
    return category?.name?.toUpperCase().includes('BEBESTIBLES') || false;
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const existingItemIndex = cartItems.findIndex(item => 
      item.product.id === selectedProduct.id &&
      JSON.stringify(item.customizations) === JSON.stringify(customizations)
    );

    if (existingItemIndex >= 0) {
      const newItems = [...cartItems];
      newItems[existingItemIndex].quantity += 1;
      setCartItems(newItems);
    } else {
      setCartItems([...cartItems, {
        product: selectedProduct,
        quantity: 1,
        customizations: { ...customizations }
      }]);
    }

    // Reset modal
    setShowProductModal(false);
    setSelectedProduct(null);
    setCustomizations({
      removedIngredients: [],
      addedIngredients: [],
      specialInstructions: ''
    });
  };

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems(cartItems.filter((_, i) => i !== index));
      return;
    }

    const newItems = [...cartItems];
    newItems[index].quantity = newQuantity;
    setCartItems(newItems);
  };

  const calculateItemTotal = (item: CartItem) => {
    const itemPrice = Number(item.product.price) || 0;
    const quantity = Number(item.quantity) || 0;
    const basePrice = itemPrice * quantity;
    
    const extraCost = item.customizations.addedIngredients.reduce((sum, ing) => {
      const price = Number(ing.price) || 0;
      return sum + price;
    }, 0) * quantity;
    
    return basePrice + extraCost;
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const itemTotal = calculateItemTotal(item);
      return total + itemTotal;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Validar formulario
      if (!customerForm.name.trim()) {
        throw new Error('El nombre del cliente es requerido');
      }
      if (!customerForm.phone.trim()) {
        throw new Error('El teléfono del cliente es requerido');
      }
      if (customerForm.deliveryType === 'delivery' && !customerForm.deliveryAddress.trim()) {
        throw new Error('La dirección es requerida para delivery');
      }
      if (cartItems.length === 0) {
        throw new Error('Debe agregar al menos un producto');
      }

      // Preparar items para el pedido con validaciones
      const orderItems = cartItems.map(item => {
        const itemPrice = Number(item.product.price) || 0;
        const quantity = Number(item.quantity) || 0;
        const baseSubtotal = itemPrice * quantity;
        
        const extraCost = item.customizations.addedIngredients.reduce((sum, ing) => {
          const price = Number(ing.price) || 0;
          return sum + price;
        }, 0) * quantity;
        
        const itemSubtotal = baseSubtotal + extraCost;
        
        return {
          productId: item.product.id,
          productName: item.product.name,
          productPrice: itemPrice,
          quantity: quantity,
          subtotal: itemSubtotal,
          removedIngredients: item.customizations.removedIngredients,
          addedIngredients: item.customizations.addedIngredients,
          specialInstructions: item.customizations.specialInstructions,
          extraIngredientsCost: extraCost
        };
      });

      const total = calculateTotal();
      
      // Validar que los totales sean válidos
      if (isNaN(total) || total <= 0) {
        throw new Error('Error en el cálculo de totales. Por favor, revisa los productos en el carrito.');
      }

      // Crear el pedido
      await orderService.createOrder({
        customerName: customerForm.name,
        customerPhone: customerForm.phone,
        customerEmail: customerForm.email || undefined,
        deliveryType: customerForm.deliveryType,
        deliveryAddress: customerForm.deliveryType === 'delivery' ? customerForm.deliveryAddress : undefined,
        deliveryLatitude: customerForm.deliveryType === 'delivery' && deliveryCoords ? deliveryCoords.lat : undefined,
        deliveryLongitude: customerForm.deliveryType === 'delivery' && deliveryCoords ? deliveryCoords.lng : undefined,
        items: orderItems,
        subtotal: total,
        discount: 0,
        total: total,
        notes: customerForm.notes,
        pointsUsed: 0,
        createdByUserId: user?.id // Pasar el ID del empleado que crea el pedido
      });

      setSuccess(true);
      setTimeout(() => {
        // Reset form
        setCartItems([]);
        setCustomerForm({
          name: '',
          phone: '',
          email: '',
          deliveryType: 'pickup',
          deliveryAddress: '',
          notes: ''
        });
        setDeliveryCoords(null);
        setShowMapPicker(false);
        setSuccess(false);
        onOrderCreated();
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando productos...</p>
      </div>
    );
  }

  return (
    <Container fluid>
      <Row>
        <Col lg={8}>
          {/* Búsqueda de Productos */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0 d-flex align-items-center">
                <ShoppingCart className="me-2" />
                Registrar Pedido Presencial
              </h5>
            </Card.Header>
            <Card.Body>
              {/* Selector de Categorías */}
              {categories.length > 0 && (
                <div className="mb-4">
                  <Row className="g-2">
                    {categories.map((category) => (
                      <Col xs={6} sm={4} md={3} lg={2} key={category.id}>
                        <Button
                          variant={selectedCategory === category.id ? 'primary' : 'outline-primary'}
                          className="w-100"
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setSearchTerm(''); // Limpiar búsqueda al cambiar categoría
                          }}
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {category.name}
                        </Button>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              {/* Búsqueda */}
              <InputGroup className="mb-4">
                <InputGroup.Text>
                  <Search size={18} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              {/* Grid de Productos con Fotos */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">
                    {searchTerm 
                      ? 'No se encontraron productos con ese nombre'
                      : 'No hay productos en esta categoría'}
                  </p>
                </div>
              ) : (
                <Row>
                  {filteredProducts.map((product) => (
                    <Col md={6} lg={4} key={product.id} className="mb-4">
                      <Card 
                        className="h-100 shadow-sm"
                        style={{
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        }}
                      >
                        {/* Imagen del Producto */}
                        <div 
                          style={{ 
                            width: '100%', 
                            height: '200px', 
                            overflow: 'hidden',
                            backgroundColor: '#f8f9fa'
                          }}
                        >
                          <img
                            src={product.image_url || '/images/logo.jpeg'}
                            alt={product.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              objectPosition: 'center'
                            }}
                          />
                        </div>
                        
                        <Card.Body className="d-flex flex-column">
                          <h6 className="card-title fw-bold">{product.name}</h6>
                          <p className="card-text text-muted small flex-grow-1" style={{ minHeight: '40px' }}>
                            {product.description}
                          </p>
                          <div className="d-flex justify-content-between align-items-center mt-auto">
                            <span className="fw-bold text-success fs-5">
                              ${product.price.toLocaleString()}
                            </span>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                const productCategory = categories.find(cat => cat.id === product.category_id);
                                const isBeverageProduct = productCategory?.name?.toUpperCase().includes('BEBESTIBLES') || false;
                                
                                setSelectedProduct(product);
                                // Limpiar ingredientes extra si es un bebestible
                                if (isBeverageProduct) {
                                  setCustomizations({
                                    removedIngredients: [],
                                    addedIngredients: [],
                                    specialInstructions: ''
                                  });
                                }
                                setShowProductModal(true);
                              }}
                            >
                              <Plus size={16} className="me-1" />
                              Agregar
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Carrito */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Carrito ({cartItems.length})</h5>
            </Card.Header>
            <Card.Body>
              {cartItems.length === 0 ? (
                <p className="text-muted text-center">No hay productos en el carrito</p>
              ) : (
                <div className="space-y-2">
                  {cartItems.map((item, index) => (
                    <div key={index} className="border rounded p-2 mb-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{item.product.name}</h6>
                          <small className="text-muted">
                            ${item.product.price.toLocaleString()} c/u
                          </small>
                          {item.customizations.addedIngredients.length > 0 && (
                            <div className="mt-1">
                              <small className="text-success">
                                + {item.customizations.addedIngredients.map(ing => ing.name).join(', ')}
                              </small>
                            </div>
                          )}
                          {item.customizations.specialInstructions && (
                            <div className="mt-1">
                              <small className="text-info">
                                Nota: {item.customizations.specialInstructions}
                              </small>
                            </div>
                          )}
                        </div>
                        <div className="text-end">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                            >
                              <Minus size={12} />
                            </Button>
                            <span className="fw-bold">{item.quantity}</span>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                            >
                              <Plus size={12} />
                            </Button>
                          </div>
                          <small className="fw-bold text-success">
                            ${calculateItemTotal(item).toLocaleString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cartItems.length > 0 && (
                <div className="border-top pt-3 mt-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Total:</h5>
                    <h5 className="mb-0 text-success">${calculateTotal().toLocaleString()}</h5>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Formulario de Cliente */}
          <Card>
            <Card.Header>
              <h5 className="mb-0 d-flex align-items-center">
                <User className="me-2" />
                Información del Cliente
              </h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Cliente *</Form.Label>
                  <Form.Control
                    type="text"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Teléfono *</Form.Label>
                  <Form.Control
                    type="tel"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                    placeholder="+56 9 XXXX XXXX"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email (opcional)</Form.Label>
                  <Form.Control
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Entrega</Form.Label>
                  <Form.Select
                    value={customerForm.deliveryType}
                    onChange={(e) => {
                      const newType = e.target.value as 'delivery' | 'pickup';
                      setCustomerForm({
                        ...customerForm, 
                        deliveryType: newType,
                        deliveryAddress: newType === 'pickup' ? '' : customerForm.deliveryAddress
                      });
                      // Limpiar coordenadas si cambia a pickup
                      if (newType === 'pickup') {
                        setDeliveryCoords(null);
                        setShowMapPicker(false);
                      }
                    }}
                  >
                    <option value="pickup">Retiro en Tienda</option>
                    <option value="delivery">Delivery</option>
                  </Form.Select>
                </Form.Group>

                {customerForm.deliveryType === 'delivery' && (
                  <Form.Group className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Form.Label className="mb-0">Dirección de Entrega *</Form.Label>
                      <Button
                        variant={showMapPicker ? 'outline-secondary' : 'outline-primary'}
                        size="sm"
                        onClick={() => setShowMapPicker(!showMapPicker)}
                      >
                        <Map size={18} className="me-1" />
                        {deliveryCoords 
                          ? (showMapPicker ? 'Ocultar Mapa' : 'Cambiar Ubicación')
                          : 'Seleccionar Ubicación en Mapa'}
                      </Button>
                    </div>
                    
                    {showMapPicker ? (
                      <AddressMapPicker
                        onLocationSelect={(lat, lng, address) => {
                          setDeliveryCoords({ lat, lng });
                          setCustomerForm({...customerForm, deliveryAddress: address});
                          setShowMapPicker(false);
                        }}
                        initialLat={deliveryCoords?.lat}
                        initialLng={deliveryCoords?.lng}
                      />
                    ) : (
                      <Form.Control
                        type="text"
                        value={customerForm.deliveryAddress}
                        onChange={(e) => setCustomerForm({...customerForm, deliveryAddress: e.target.value})}
                        placeholder="Dirección completa o selecciona en el mapa"
                        required
                      />
                    )}
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Notas Adicionales</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={customerForm.notes}
                    onChange={(e) => setCustomerForm({...customerForm, notes: e.target.value})}
                    placeholder="Instrucciones especiales..."
                  />
                </Form.Group>

                {error && (
                  <Alert variant="danger" className="mb-3">
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert variant="success" className="mb-3">
                    <CheckCircle className="me-2" />
                    ¡Pedido registrado exitosamente!
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="success"
                  className="w-100"
                  disabled={submitting || cartItems.length === 0}
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="me-2" />
                      Registrar Pedido
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de Personalización de Producto */}
      <Modal 
        show={showProductModal} 
        onHide={() => {
          setShowProductModal(false);
          setSelectedProduct(null);
          setCustomizations({
            removedIngredients: [],
            addedIngredients: [],
            specialInstructions: ''
          });
        }} 
        size="lg"
        centered
        contentClassName="border-0"
        style={{ borderRadius: '16px', overflow: 'hidden' }}
      >
        {selectedProduct && (
          <>
            {/* Header con gradiente usando paleta del logo (negro a verde) */}
            <div
              style={{
                background: 'linear-gradient(135deg, #000000 0%, #0B6E4F 100%)',
                padding: '24px',
                color: 'white',
                position: 'relative'
              }}
            >
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setSelectedProduct(null);
                  setCustomizations({
                    removedIngredients: [],
                    addedIngredients: [],
                    specialInstructions: ''
                  });
                }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X size={20} />
              </button>
              <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
                {selectedProduct.name}
              </h2>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                {selectedProduct.description}
              </p>
            </div>

            <Modal.Body style={{ padding: '24px' }}>
              {/* Precio base */}
              <div className="mb-4" style={{ paddingBottom: '16px', borderBottom: '1px solid #e9ecef' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <span style={{ fontSize: '14px', color: '#6c757d' }}>Precio base:</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#000' }}>
                    ${(Number(selectedProduct.price) || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Ingredientes Extra - Solo mostrar si NO es un bebestible */}
              {!isBeverage(selectedProduct) && (
                <div className="mb-4">
                  <label className="form-label fw-bold mb-3" style={{ fontSize: '16px', color: '#000' }}>
                    Ingredientes Extra
                  </label>
                  {/* Ingredientes Básicos */}
                  {extraIngredients.filter(ing => ing.category === 'basic' && ing.is_available).length > 0 && (
                    <div className="mb-4">
                      <h6 className="text-primary mb-3 fw-bold">
                        <span className="badge bg-primary me-2">Básicos</span>
                        Ingredientes Básicos
                      </h6>
                      <div 
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                          gap: '12px'
                        }}
                      >
                        {extraIngredients
                          .filter(ing => ing.category === 'basic' && ing.is_available)
                          .map((ingredient) => {
                            const isSelected = customizations.addedIngredients.some(ing => ing.id === ingredient.id);
                            return (
                              <div
                                key={ingredient.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setCustomizations({
                                      ...customizations,
                                      addedIngredients: customizations.addedIngredients.filter(ing => ing.id !== ingredient.id)
                                    });
                                  } else {
                                    setCustomizations({
                                      ...customizations,
                                      addedIngredients: [...customizations.addedIngredients, ingredient]
                                    });
                                  }
                                }}
                                style={{
                                  padding: '12px 16px',
                                  borderRadius: '8px',
                                  border: `2px solid ${isSelected ? '#0B6E4F' : '#dee2e6'}`,
                                  background: isSelected ? '#f0f9f6' : '#fff',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = '#adb5bd';
                                    e.currentTarget.style.background = '#f8f9fa';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = '#dee2e6';
                                    e.currentTarget.style.background = '#fff';
                                  }
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    style={{
                                      width: '18px',
                                      height: '18px',
                                      cursor: 'pointer',
                                      accentColor: '#0B6E4F'
                                    }}
                                  />
                                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#000' }}>
                                    {ingredient.name}
                                  </span>
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#0B6E4F' }}>
                                  +${(Number(ingredient.price) || 0).toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Ingredientes Premium */}
                  {extraIngredients.filter(ing => ing.category === 'premium' && ing.is_available).length > 0 && (
                    <div>
                      <h6 className="text-warning mb-3 fw-bold">
                        <span className="badge bg-warning text-dark me-2">Premium</span>
                        Ingredientes Premium
                      </h6>
                      <div 
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                          gap: '12px'
                        }}
                      >
                        {extraIngredients
                          .filter(ing => ing.category === 'premium' && ing.is_available)
                          .map((ingredient) => {
                            const isSelected = customizations.addedIngredients.some(ing => ing.id === ingredient.id);
                            return (
                              <div
                                key={ingredient.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setCustomizations({
                                      ...customizations,
                                      addedIngredients: customizations.addedIngredients.filter(ing => ing.id !== ingredient.id)
                                    });
                                  } else {
                                    setCustomizations({
                                      ...customizations,
                                      addedIngredients: [...customizations.addedIngredients, ingredient]
                                    });
                                  }
                                }}
                                style={{
                                  padding: '12px 16px',
                                  borderRadius: '8px',
                                  border: `2px solid ${isSelected ? '#ffc107' : '#dee2e6'}`,
                                  background: isSelected ? '#fffbf0' : '#fff',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = '#ffc107';
                                    e.currentTarget.style.background = '#fffbf0';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = '#dee2e6';
                                    e.currentTarget.style.background = '#fff';
                                  }
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    style={{
                                      width: '18px',
                                      height: '18px',
                                      cursor: 'pointer',
                                      accentColor: '#ffc107'
                                    }}
                                  />
                                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#000' }}>
                                    {ingredient.name}
                                  </span>
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffc107' }}>
                                  +${(Number(ingredient.price) || 0).toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {extraIngredients.filter(ing => ing.is_available).length === 0 && (
                    <div className="text-center py-3 text-muted">
                      No hay ingredientes disponibles
                    </div>
                  )}
                </div>
              )}

              {/* Instrucciones Especiales */}
              <div className="mb-4">
                <Form.Label className="fw-bold mb-3" style={{ fontSize: '16px', color: '#000' }}>
                  Instrucciones Especiales
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={customizations.specialInstructions}
                  onChange={(e) => setCustomizations({
                    ...customizations,
                    specialInstructions: e.target.value
                  })}
                  placeholder="Ej: Sin cebolla, bien cocida..."
                  style={{
                    borderRadius: '8px',
                    border: '1px solid #dee2e6',
                    padding: '12px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Total */}
              <div 
                style={{
                  paddingTop: '20px',
                  borderTop: '1px solid #e9ecef',
                  marginTop: '20px'
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>Total:</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#0B6E4F' }}>
                    ${((Number(selectedProduct.price) || 0) + 
                      customizations.addedIngredients.reduce((sum, ing) => sum + (Number(ing.price) || 0), 0)
                    ).toLocaleString()}
                  </span>
                </div>

                {/* Botones */}
                <div className="d-flex gap-3">
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setShowProductModal(false);
                      setSelectedProduct(null);
                      setCustomizations({
                        removedIngredients: [],
                        addedIngredients: [],
                        specialInstructions: ''
                      });
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #dee2e6',
                      fontWeight: '600',
                      fontSize: '16px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#adb5bd';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.borderColor = '#dee2e6';
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddToCart}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      background: '#0B6E4F',
                      border: 'none',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#095a41';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#0B6E4F';
                    }}
                  >
                    <ShoppingCart size={18} />
                    Agregar al Carrito
                  </Button>
                </div>
              </div>
            </Modal.Body>
          </>
        )}
      </Modal>
    </Container>
  );
}

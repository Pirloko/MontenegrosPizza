import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert, Spinner, Badge, InputGroup, Image } from 'react-bootstrap';
import { Plus, Edit2, Trash2, Eye, EyeOff, Upload, X } from 'lucide-react';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { ingredientService } from '../../services/ingredientService';
import { productIngredientService } from '../../services/productIngredientService';
import { Database } from '../../types/database';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type ExtraIngredient = Database['public']['Tables']['extra_ingredients']['Row'];

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<ExtraIngredient[]>([]);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    cost: 0,
    category_id: '',
    image_url: '',
    is_vegetarian: false,
    is_active: true,
    available: true,
    stock_quantity: 999,
    low_stock_alert: 10
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [productsData, categoriesData, ingredientsData] = await Promise.all([
        productService.getAll(),
        categoryService.getActive(),
        ingredientService.getAll()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setIngredients(ingredientsData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Error al cargar datos: ' + err.message);
      // Mostrar mensaje pero no bloquear completamente
    } finally {
      setLoading(false);
    }
  }

  async function loadProductIngredients(productId: string) {
    try {
      const productIngredients = await productIngredientService.getByProduct(productId);
      setSelectedIngredientIds(productIngredients.map(pi => pi.ingredient_id));
    } catch (err: any) {
      console.error('Error loading product ingredients:', err);
    }
  }

  async function handleOpenModal(product?: Product) {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        cost: product.cost,
        category_id: product.category_id || '',
        image_url: product.image_url || '',
        is_vegetarian: product.is_vegetarian,
        is_active: product.is_active,
        available: product.available ?? true,
        stock_quantity: product.stock_quantity ?? 999,
        low_stock_alert: product.low_stock_alert ?? 10
      });
      setImagePreview(product.image_url);
      await loadProductIngredients(product.id);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        cost: 0,
        category_id: categories.length > 0 ? categories[0].id : '',
        image_url: '',
        is_vegetarian: false,
        is_active: true,
        available: true,
        stock_quantity: 999,
        low_stock_alert: 10
      });
      setImagePreview(null);
      setSelectedIngredientIds([]);
    }
    setImageFile(null);
    setShowModal(true);
    setError('');
    setSuccess('');
  }

  function handleCloseModal() {
    setShowModal(false);
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
    setSelectedIngredientIds([]);
    setError('');
    setSuccess('');
    setUploading(false);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image_url: '' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (uploading) return; // Prevenir doble submit
    
    setUploading(true);

    try {
      let imageUrl = formData.image_url;

      // Upload image if a new one was selected
      if (imageFile) {
        const productId = editingProduct?.id || crypto.randomUUID();
        imageUrl = await productService.uploadImage(imageFile, productId);
      }

      const productData = {
        ...formData,
        image_url: imageUrl,
        category_id: formData.category_id || null
      };

      // Guardar producto
      let savedProductId: string;
      if (editingProduct) {
        await productService.update(editingProduct.id, productData);
        savedProductId = editingProduct.id;
        setSuccess('Producto actualizado correctamente');
      } else {
        const newProduct = await productService.create(productData);
        savedProductId = newProduct.id;
        setSuccess('Producto creado correctamente');
      }

      // Sincronizar ingredientes del producto
      if (savedProductId) {
        await productIngredientService.syncProductIngredients(savedProductId, selectedIngredientIds);
      }
      
      // CERRAR MODAL INMEDIATAMENTE - No esperar nada
      handleCloseModal();
      setUploading(false);
      
      // Recargar en segundo plano sin bloquear
      // NO esperamos esta promesa
      loadData();
      
    } catch (err: any) {
      console.error('Error:', err);
      setError('Error: ' + (err.message || 'Error desconocido'));
      setUploading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Estás seguro de eliminar el producto "${name}"?`)) return;

    try {
      const product = products.find(p => p.id === id);
      if (product?.image_url) {
        await productService.deleteImage(product.image_url);
      }
      await productService.delete(id);
      setSuccess('Producto eliminado correctamente');
      await loadData();
    } catch (err: any) {
      setError('Error al eliminar: ' + err.message);
    }
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    try {
      await productService.toggleActive(id, !currentStatus);
      setSuccess(`Producto ${!currentStatus ? 'activado' : 'desactivado'} correctamente`);
      await loadData();
    } catch (err: any) {
      setError('Error: ' + err.message);
    }
  }

  async function handleToggleAvailable(id: string, currentStatus: boolean) {
    try {
      await productService.update(id, { available: !currentStatus });
      setSuccess(`Producto marcado como ${!currentStatus ? 'disponible' : 'agotado'}`);
      await loadData();
    } catch (err: any) {
      setError('Error: ' + err.message);
    }
  }

  async function handleUpdateStock(id: string, quantity: number) {
    try {
      await productService.update(id, { stock_quantity: quantity });
      setSuccess('Stock actualizado correctamente');
      await loadData();
    } catch (err: any) {
      setError('Error: ' + err.message);
    }
  }

  function getCategoryName(categoryId: string | null) {
    if (!categoryId) return '-';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '-';
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="danger" />
        <p className="mt-3">Cargando productos...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">Gestión de Productos</h3>
        <Button variant="danger" onClick={() => handleOpenModal()}>
          <Plus size={18} className="me-2" />
          Nuevo Producto
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th style={{ width: '80px' }}>Imagen</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Costo</th>
            <th>Ganancia</th>
            <th>Inventario</th>
            <th>Estado</th>
            <th style={{ width: '180px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center text-muted">
                No hay productos registrados
              </td>
            </tr>
          ) : (
            products.map((product) => {
              const profit = product.price - product.cost;
              const profitPercent = product.cost > 0 ? ((profit / product.cost) * 100).toFixed(0) : 0;
              const isLowStock = product.stock_quantity <= product.low_stock_alert && product.stock_quantity !== 999;
              
              return (
                <tr key={product.id}>
                  <td>
                    {product.image_url ? (
                      <Image src={product.image_url} thumbnail style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '60px', height: '60px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <small>Sin imagen</small>
                      </div>
                    )}
                  </td>
                  <td>
                    <strong>{product.name}</strong>
                    {product.is_vegetarian && <Badge bg="success" className="ms-2">Vegetariano</Badge>}
                    {!product.available && <Badge bg="danger" className="ms-2">AGOTADO</Badge>}
                    <br />
                    <small className="text-muted">{product.description}</small>
                  </td>
                  <td>{getCategoryName(product.category_id)}</td>
                  <td><strong>${product.price.toLocaleString('es-CL')}</strong></td>
                  <td>${product.cost.toLocaleString('es-CL')}</td>
                  <td>
                    <span className={profit > 0 ? 'text-success' : 'text-danger'}>
                      ${profit.toLocaleString('es-CL')}
                    </span>
                    <br />
                    <small className="text-muted">({profitPercent}%)</small>
                  </td>
                  <td>
                    {product.stock_quantity === 999 ? (
                      <Badge bg="info">Ilimitado</Badge>
                    ) : (
                      <>
                        <strong>{product.stock_quantity}</strong> unidades
                        {isLowStock && (
                          <Badge bg="warning" className="ms-2">Stock Bajo</Badge>
                        )}
                      </>
                    )}
                  </td>
                  <td>
                    <Badge bg={product.is_active ? 'success' : 'secondary'}>
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <br />
                    <Badge bg={product.available ? 'success' : 'danger'} className="mt-1">
                      {product.available ? 'Disponible' : 'Agotado'}
                    </Badge>
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => handleOpenModal(product)}
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant={product.is_active ? 'outline-warning' : 'outline-success'}
                        onClick={() => handleToggleActive(product.id, product.is_active)}
                        title={product.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {product.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </Button>
                      <Button
                        size="sm"
                        variant={product.available ? 'outline-danger' : 'outline-success'}
                        onClick={() => handleToggleAvailable(product.id, product.available)}
                        title={product.available ? 'Marcar Agotado' : 'Marcar Disponible'}
                      >
                        {product.available ? '📦' : '✅'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDelete(product.id, product.name)}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>

      {/* Modal for Create/Edit */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title className="fw-bold">
            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ padding: '24px' }}>
            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Nombre *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ej: Pizza Napolitana"
                    style={{ fontSize: '15px', padding: '10px' }}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Categoría *</Form.Label>
                  <Form.Select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                    style={{ fontSize: '15px', padding: '10px' }}
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del producto"
                style={{ fontSize: '15px', padding: '10px' }}
              />
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Precio de Venta *</Form.Label>
                  <InputGroup>
                    <InputGroup.Text style={{ background: '#f8f9fa', fontWeight: '500' }}>$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      required
                      min={0}
                      step={1}
                      style={{ fontSize: '15px', padding: '10px' }}
                    />
                  </InputGroup>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Costo</Form.Label>
                  <InputGroup>
                    <InputGroup.Text style={{ background: '#f8f9fa', fontWeight: '500' }}>$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                      min={0}
                      step={1}
                      style={{ fontSize: '15px', padding: '10px' }}
                    />
                  </InputGroup>
                  <Form.Text className="text-muted small">
                    Ganancia: <strong className="text-success">${(formData.price - formData.cost).toLocaleString('es-CL')}</strong>
                  </Form.Text>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Imagen del Producto</Form.Label>
              {imagePreview && (
                <div className="mb-3 position-relative" style={{ width: '200px' }}>
                  <Image src={imagePreview} thumbnail className="w-100" style={{ borderRadius: '8px' }} />
                  <Button
                    size="sm"
                    variant="danger"
                    className="position-absolute top-0 end-0 m-1"
                    onClick={handleRemoveImage}
                    style={{ borderRadius: '50%', width: '28px', height: '28px', padding: 0 }}
                  >
                    <X size={14} />
                  </Button>
                </div>
              )}
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ fontSize: '15px', padding: '8px' }}
              />
              <Form.Text className="text-muted small">
                Formatos: JPG, PNG, WEBP (máx. 5MB)
              </Form.Text>
            </Form.Group>

            <div className="row">
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <div className="p-3 border rounded" style={{ background: '#f8f9fa', height: '100%' }}>
                    <Form.Check
                      type="switch"
                      id="vegetarian-switch"
                      label={
                        <span className="fw-semibold">
                          {formData.is_vegetarian ? (
                            <span className="text-success">✓ Vegetariano</span>
                          ) : (
                            <span className="text-muted">✗ No vegetariano</span>
                          )}
                        </span>
                      }
                      checked={formData.is_vegetarian}
                      onChange={(e) => setFormData({ ...formData, is_vegetarian: e.target.checked })}
                    />
                  </div>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <div className="p-3 border rounded" style={{ background: '#f8f9fa', height: '100%' }}>
                    <Form.Check
                      type="switch"
                      id="active-switch"
                      label={
                        <span className="fw-semibold">
                          {formData.is_active ? (
                            <span className="text-success">✓ Activo</span>
                          ) : (
                            <span className="text-muted">✗ Inactivo</span>
                          )}
                        </span>
                      }
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                  </div>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <div className="p-3 border rounded" style={{ background: '#f8f9fa', height: '100%' }}>
                    <Form.Check
                      type="switch"
                      id="available-switch"
                      label={
                        <span className="fw-semibold">
                          {formData.available ? (
                            <span className="text-success">✓ Disponible</span>
                          ) : (
                            <span className="text-muted">✗ No disponible</span>
                          )}
                        </span>
                      }
                      checked={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    />
                  </div>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Cantidad en Stock</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                    min={0}
                    style={{ fontSize: '15px', padding: '10px' }}
                  />
                  <Form.Text className="text-muted small">
                    Usa 999 para stock ilimitado
                  </Form.Text>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Alerta de Stock Bajo</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.low_stock_alert}
                    onChange={(e) => setFormData({ ...formData, low_stock_alert: parseInt(e.target.value) })}
                    min={0}
                    style={{ fontSize: '15px', padding: '10px' }}
                  />
                  <Form.Text className="text-muted small">
                    Te alertaremos cuando queden estas unidades
                  </Form.Text>
                </Form.Group>
              </div>
            </div>

            {/* Selección de Ingredientes */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Ingredientes del Producto</Form.Label>
              <Form.Text className="text-muted d-block mb-3 small">
                Selecciona los ingredientes que incluye este producto para un mejor manejo de stock
              </Form.Text>
              
              {/* Ingredientes Básicos */}
              <div className="mb-3">
                <h6 className="text-primary fw-bold mb-2">
                  <span className="badge bg-primary me-2">Básicos</span>
                  Ingredientes Básicos
                </h6>
                <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto', background: '#f8f9fa' }}>
                  {ingredients.filter(ing => (ing as any).category === 'basic' && ing.is_available).length === 0 ? (
                    <p className="text-muted small mb-0">No hay ingredientes básicos disponibles</p>
                  ) : (
                    ingredients
                      .filter(ing => (ing as any).category === 'basic' && ing.is_available)
                      .map(ingredient => (
                        <Form.Check
                          key={ingredient.id}
                          type="checkbox"
                          id={`ingredient-${ingredient.id}`}
                          label={
                            <span>
                              <strong>{ingredient.name}</strong>
                              <span className="text-muted ms-2">(${ingredient.price.toLocaleString('es-CL')})</span>
                            </span>
                          }
                          checked={selectedIngredientIds.includes(ingredient.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIngredientIds([...selectedIngredientIds, ingredient.id]);
                            } else {
                              setSelectedIngredientIds(selectedIngredientIds.filter(id => id !== ingredient.id));
                            }
                          }}
                          className="mb-2"
                        />
                      ))
                  )}
                </div>
              </div>

              {/* Ingredientes Premium */}
              <div className="mb-3">
                <h6 className="text-warning fw-bold mb-2">
                  <span className="badge bg-warning text-dark me-2">Premium</span>
                  Ingredientes Premium
                </h6>
                <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto', background: '#fffbf0' }}>
                  {ingredients.filter(ing => (ing as any).category === 'premium' && ing.is_available).length === 0 ? (
                    <p className="text-muted small mb-0">No hay ingredientes premium disponibles</p>
                  ) : (
                    ingredients
                      .filter(ing => (ing as any).category === 'premium' && ing.is_available)
                      .map(ingredient => (
                        <Form.Check
                          key={ingredient.id}
                          type="checkbox"
                          id={`ingredient-${ingredient.id}`}
                          label={
                            <span>
                              <strong>{ingredient.name}</strong>
                              <span className="text-muted ms-2">(${ingredient.price.toLocaleString('es-CL')})</span>
                            </span>
                          }
                          checked={selectedIngredientIds.includes(ingredient.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIngredientIds([...selectedIngredientIds, ingredient.id]);
                            } else {
                              setSelectedIngredientIds(selectedIngredientIds.filter(id => id !== ingredient.id));
                            }
                          }}
                          className="mb-2"
                        />
                      ))
                  )}
                </div>
              </div>

              {selectedIngredientIds.length > 0 && (
                <Alert variant="info" className="mt-2">
                  <strong>{selectedIngredientIds.length}</strong> ingrediente(s) seleccionado(s)
                </Alert>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ padding: '16px 24px', borderTop: '1px solid #dee2e6' }}>
            <Button variant="secondary" onClick={handleCloseModal} disabled={uploading} style={{ padding: '8px 20px' }}>
              Cancelar
            </Button>
            <Button variant="danger" type="submit" disabled={uploading} style={{ padding: '8px 20px', fontWeight: '600' }}>
              {uploading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {imageFile ? 'Subiendo imagen...' : 'Guardando...'}
                </>
              ) : (
                editingProduct ? 'Guardar Cambios' : 'Crear Producto'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}


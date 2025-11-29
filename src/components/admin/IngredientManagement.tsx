import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert, Spinner, Badge, InputGroup } from 'react-bootstrap';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { ingredientService } from '../../services/ingredientService';
import { Database } from '../../types/database';

type ExtraIngredient = Database['public']['Tables']['extra_ingredients']['Row'];

export default function IngredientManagement() {
  const [ingredients, setIngredients] = useState<ExtraIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<ExtraIngredient | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    is_available: true,
    category: 'basic' as 'basic' | 'premium'
  });

  useEffect(() => {
    loadIngredients();
  }, []);

  async function loadIngredients() {
    try {
      setLoading(true);
      const data = await ingredientService.getAll();
      setIngredients(data);
    } catch (err: any) {
      setError('Error al cargar ingredientes: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenModal(ingredient?: ExtraIngredient) {
    if (ingredient) {
      setEditingIngredient(ingredient);
      setFormData({
        name: ingredient.name,
        price: ingredient.price || 0,
        is_available: ingredient.is_available,
        category: (ingredient as any).category || 'basic'
      });
    } else {
      setEditingIngredient(null);
      setFormData({
        name: '',
        price: 0,
        is_available: true,
        category: 'basic'
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  }

  function handleCloseModal() {
    setShowModal(false);
    setEditingIngredient(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validar precio
    if (isNaN(formData.price) || formData.price < 0) {
      setError('El precio debe ser un número válido mayor o igual a 0');
      return;
    }

    try {
      // Preparar datos con category
      const submitData: any = {
        name: formData.name,
        price: formData.price,
        is_available: formData.is_available,
        category: formData.category
      };

      if (editingIngredient) {
        await ingredientService.update(editingIngredient.id, submitData);
        setSuccess('Ingrediente actualizado correctamente');
      } else {
        await ingredientService.create(submitData);
        setSuccess('Ingrediente creado correctamente');
      }
      handleCloseModal();
      await loadIngredients();
    } catch (err: any) {
      // Si el error es por la columna category, intentar sin ella
      if (err.message?.includes('category') || err.message?.includes('column')) {
        try {
          const submitDataWithoutCategory = {
            name: formData.name,
            price: formData.price,
            is_available: formData.is_available
          };
          if (editingIngredient) {
            await ingredientService.update(editingIngredient.id, submitDataWithoutCategory);
            setSuccess('Ingrediente actualizado correctamente. Nota: Ejecuta el script SQL para habilitar categorías.');
          } else {
            await ingredientService.create(submitDataWithoutCategory);
            setSuccess('Ingrediente creado correctamente. Nota: Ejecuta el script SQL para habilitar categorías.');
          }
          handleCloseModal();
          await loadIngredients();
        } catch (retryErr: any) {
          setError('Error: ' + retryErr.message);
        }
      } else {
        setError('Error: ' + err.message);
      }
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Estás seguro de eliminar el ingrediente "${name}"?`)) return;

    try {
      await ingredientService.delete(id);
      setSuccess('Ingrediente eliminado correctamente');
      await loadIngredients();
    } catch (err: any) {
      setError('Error al eliminar: ' + err.message);
    }
  }

  async function handleToggleAvailable(id: string, currentStatus: boolean) {
    try {
      await ingredientService.toggleAvailable(id, !currentStatus);
      setSuccess(`Ingrediente ${!currentStatus ? 'disponible' : 'no disponible'}`);
      await loadIngredients();
    } catch (err: any) {
      setError('Error: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="danger" />
        <p className="mt-3">Cargando ingredientes...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">Gestión de Ingredientes Extra</h3>
          <p className="text-muted mb-0">Administra los ingredientes básicos y premium disponibles</p>
        </div>
        <Button variant="danger" onClick={() => handleOpenModal()}>
          <Plus size={18} className="me-2" />
          Nuevo Ingrediente
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Categoría</th>
            <th>Estado</th>
            <th style={{ width: '150px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center text-muted">
                No hay ingredientes registrados
              </td>
            </tr>
          ) : (
            ingredients.map((ingredient) => (
              <tr key={ingredient.id}>
                <td><strong>{ingredient.name}</strong></td>
                <td>${ingredient.price.toLocaleString('es-CL')}</td>
                <td>
                  {(ingredient as any).category ? (
                    <Badge bg={(ingredient as any).category === 'premium' ? 'warning' : 'info'}>
                      {(ingredient as any).category === 'premium' ? 'Premium' : 'Básico'}
                    </Badge>
                  ) : (
                    <Badge bg="secondary">Sin categoría</Badge>
                  )}
                </td>
                <td>
                  <Badge bg={ingredient.is_available ? 'success' : 'secondary'}>
                    {ingredient.is_available ? 'Disponible' : 'No disponible'}
                  </Badge>
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => handleOpenModal(ingredient)}
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant={ingredient.is_available ? 'outline-warning' : 'outline-success'}
                      onClick={() => handleToggleAvailable(ingredient.id, ingredient.is_available)}
                      title={ingredient.is_available ? 'Marcar no disponible' : 'Marcar disponible'}
                    >
                      {ingredient.is_available ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(ingredient.id, ingredient.name)}
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {/* Modal for Create/Edit */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title className="fw-bold">
            {editingIngredient ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
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
                    placeholder="Ej: Queso Extra"
                    style={{ fontSize: '15px', padding: '10px' }}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Precio *</Form.Label>
                  <InputGroup>
                    <InputGroup.Text style={{ background: '#f8f9fa', fontWeight: '500' }}>$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? 0 : parseFloat(value);
                        if (!isNaN(numValue) && numValue >= 0) {
                          setFormData({ ...formData, price: numValue });
                        }
                      }}
                      required
                      min={0}
                      step={100}
                      placeholder="1000"
                      style={{ fontSize: '15px', padding: '10px' }}
                    />
                  </InputGroup>
                  <Form.Text className="text-muted small">
                    Precio por porción adicional
                  </Form.Text>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Categoría *</Form.Label>
                  <Form.Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as 'basic' | 'premium' })}
                    required
                    style={{ fontSize: '15px', padding: '10px' }}
                  >
                    <option value="basic">Básico</option>
                    <option value="premium">Premium</option>
                  </Form.Select>
                  <Form.Text className="text-muted small">
                    Los ingredientes básicos y premium se mostrarán separados en el menú
                  </Form.Text>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Disponibilidad</Form.Label>
                  <div className="mt-2 p-3 border rounded" style={{ background: '#f8f9fa' }}>
                    <Form.Check
                      type="switch"
                      id="available-switch"
                      label={
                        <span className="fw-semibold">
                          {formData.is_available ? (
                            <span className="text-success">✓ Disponible</span>
                          ) : (
                            <span className="text-muted">✗ No disponible</span>
                          )}
                        </span>
                      }
                      checked={formData.is_available}
                      onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    />
                  </div>
                </Form.Group>
              </div>
            </div>

            {/* Información adicional */}
            <div className="mt-3 p-3 rounded" style={{ background: '#e7f3ff', border: '1px solid #b3d9ff' }}>
              <div className="d-flex align-items-start gap-2">
                <div style={{ fontSize: '20px' }}>ℹ️</div>
                <div>
                  <strong className="text-primary">Información:</strong>
                  <ul className="mb-0 mt-2 small text-muted">
                    <li>Los ingredientes <strong>Básicos</strong> se mostrarán con badge azul</li>
                    <li>Los ingredientes <strong>Premium</strong> se mostrarán con badge amarillo</li>
                    <li>Los clientes verán los ingredientes separados por categoría al personalizar productos</li>
                  </ul>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer style={{ padding: '16px 24px', borderTop: '1px solid #dee2e6' }}>
            <Button variant="secondary" onClick={handleCloseModal} style={{ padding: '8px 20px' }}>
              Cancelar
            </Button>
            <Button variant="danger" type="submit" style={{ padding: '8px 20px', fontWeight: '600' }}>
              {editingIngredient ? 'Guardar Cambios' : 'Crear Ingrediente'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}


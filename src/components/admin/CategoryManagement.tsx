import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import { Plus, Edit2, Trash2, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import { categoryService } from '../../services/categoryService';
import { Database } from '../../types/database';

type Category = Database['public']['Tables']['categories']['Row'];

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (err: any) {
      setError('Error al cargar categorías: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenModal(category?: Category) {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        display_order: category.display_order,
        is_active: category.is_active
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        display_order: categories.length,
        is_active: true
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  }

  function handleCloseModal() {
    setShowModal(false);
    setEditingCategory(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingCategory) {
        await categoryService.update(editingCategory.id, formData);
        setSuccess('Categoría actualizada correctamente');
      } else {
        await categoryService.create(formData);
        setSuccess('Categoría creada correctamente');
      }
      handleCloseModal();
      await loadCategories();
    } catch (err: any) {
      setError('Error: ' + err.message);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${name}"?`)) return;

    try {
      await categoryService.delete(id);
      setSuccess('Categoría eliminada correctamente');
      await loadCategories();
    } catch (err: any) {
      setError('Error al eliminar: ' + err.message);
    }
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    try {
      await categoryService.toggleActive(id, !currentStatus);
      setSuccess(`Categoría ${!currentStatus ? 'activada' : 'desactivada'} correctamente`);
      await loadCategories();
    } catch (err: any) {
      setError('Error: ' + err.message);
    }
  }

  async function handleMoveUp(category: Category) {
    try {
      const sortedCategories = [...categories].sort((a, b) => a.display_order - b.display_order);
      const currentIndex = sortedCategories.findIndex(c => c.id === category.id);
      
      if (currentIndex === 0) {
        setError('La categoría ya está en la primera posición');
        return;
      }

      const previousCategory = sortedCategories[currentIndex - 1];
      const tempOrder = category.display_order;
      
      // Intercambiar órdenes
      await Promise.all([
        categoryService.update(category.id, { display_order: previousCategory.display_order }),
        categoryService.update(previousCategory.id, { display_order: tempOrder })
      ]);

      setSuccess('Orden actualizado correctamente');
      await loadCategories();
    } catch (err: any) {
      setError('Error al cambiar el orden: ' + err.message);
    }
  }

  async function handleMoveDown(category: Category) {
    try {
      const sortedCategories = [...categories].sort((a, b) => a.display_order - b.display_order);
      const currentIndex = sortedCategories.findIndex(c => c.id === category.id);
      
      if (currentIndex === sortedCategories.length - 1) {
        setError('La categoría ya está en la última posición');
        return;
      }

      const nextCategory = sortedCategories[currentIndex + 1];
      const tempOrder = category.display_order;
      
      // Intercambiar órdenes
      await Promise.all([
        categoryService.update(category.id, { display_order: nextCategory.display_order }),
        categoryService.update(nextCategory.id, { display_order: tempOrder })
      ]);

      setSuccess('Orden actualizado correctamente');
      await loadCategories();
    } catch (err: any) {
      setError('Error al cambiar el orden: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="danger" />
        <p className="mt-3">Cargando categorías...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">Gestión de Categorías</h3>
          <p className="text-muted mb-0">Administra las categorías de productos disponibles</p>
        </div>
        <Button variant="danger" onClick={() => handleOpenModal()}>
          <Plus size={18} className="me-2" />
          Nueva Categoría
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th style={{ width: '150px' }}>Orden</th>
            <th>Estado</th>
            <th style={{ width: '200px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center text-muted">
                No hay categorías registradas
              </td>
            </tr>
          ) : (
            (() => {
              const sortedCategories = [...categories].sort((a, b) => a.display_order - b.display_order);
              return sortedCategories.map((category, index) => (
                <tr key={category.id}>
                  <td><strong>{category.name}</strong></td>
                  <td>{category.description || '-'}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg="info" style={{ minWidth: '40px', textAlign: 'center' }}>
                        {category.display_order}
                      </Badge>
                      <div className="d-flex flex-column gap-1">
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => handleMoveUp(category)}
                          disabled={index === 0}
                          title="Mover arriba"
                          style={{ padding: '2px 6px', lineHeight: '1' }}
                        >
                          <ChevronUp size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => handleMoveDown(category)}
                          disabled={index === sortedCategories.length - 1}
                          title="Mover abajo"
                          style={{ padding: '2px 6px', lineHeight: '1' }}
                        >
                          <ChevronDown size={12} />
                        </Button>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge bg={category.is_active ? 'success' : 'secondary'}>
                      {category.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => handleOpenModal(category)}
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant={category.is_active ? 'outline-warning' : 'outline-success'}
                        onClick={() => handleToggleActive(category.id, category.is_active)}
                        title={category.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {category.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDelete(category.id, category.name)}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ));
            })()
          )}
        </tbody>
      </Table>

      {/* Modal for Create/Edit */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title className="fw-bold">
            {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ padding: '24px' }}>
            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

            <div className="row">
              <div className="col-md-8">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Nombre *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ej: PIZZAS"
                    style={{ fontSize: '15px', padding: '10px' }}
                  />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Orden de visualización</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    min={0}
                    style={{ fontSize: '15px', padding: '10px' }}
                  />
                  <Form.Text className="text-muted small">
                    Menor número = aparece primero
                  </Form.Text>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional de la categoría"
                style={{ fontSize: '15px', padding: '10px' }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Estado</Form.Label>
              <div className="p-3 border rounded" style={{ background: '#f8f9fa' }}>
                <Form.Check
                  type="switch"
                  id="active-switch"
                  label={
                    <span className="fw-semibold">
                      {formData.is_active ? (
                        <span className="text-success">✓ Categoría Activa</span>
                      ) : (
                        <span className="text-muted">✗ Categoría Inactiva</span>
                      )}
                    </span>
                  }
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <Form.Text className="text-muted small d-block mt-2">
                  Las categorías inactivas no se mostrarán en el menú para los clientes
                </Form.Text>
              </div>
            </Form.Group>

            {/* Información adicional */}
            <div className="mt-3 p-3 rounded" style={{ background: '#e7f3ff', border: '1px solid #b3d9ff' }}>
              <div className="d-flex align-items-start gap-2">
                <div style={{ fontSize: '20px' }}>ℹ️</div>
                <div>
                  <strong className="text-primary">Información:</strong>
                  <ul className="mb-0 mt-2 small text-muted">
                    <li>El <strong>orden de visualización</strong> determina el orden en que aparecen las categorías en el menú</li>
                    <li>Las categorías se ordenan de menor a mayor número</li>
                    <li>Solo las categorías activas serán visibles para los clientes</li>
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
              {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}


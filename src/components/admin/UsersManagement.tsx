import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert, Spinner, Badge, InputGroup } from 'react-bootstrap';
import { Plus, Edit2, Trash2, Eye, EyeOff, User, Mail, Phone } from 'lucide-react';
import { userService } from '../../services/userService';
import { Database } from '../../types/database';
import { supabase } from '../../lib/supabase';

type User = Database['public']['Tables']['users']['Row'];

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creatingAuth, setCreatingAuth] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    role: 'employee' as 'employee' | 'delivery',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await userService.getEmployeesAndDelivery();
      setUsers(data);
    } catch (err: any) {
      setError('Error al cargar usuarios: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenModal(user?: User) {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        full_name: user.full_name,
        phone: user.phone || '',
        role: user.role as 'employee' | 'delivery',
        password: '',
        confirmPassword: ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        full_name: '',
        phone: '',
        role: 'employee',
        password: '',
        confirmPassword: ''
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  }

  function handleCloseModal() {
    setShowModal(false);
    setEditingUser(null);
    setError('');
    setSuccess('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones
    if (!formData.email || !formData.full_name) {
      setError('Email y nombre son obligatorios');
      return;
    }

    if (!editingUser) {
      // Crear nuevo usuario
      if (!formData.password || formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }

      try {
        setCreatingAuth(true);
        
        // Intentar crear usuario usando Edge Function (método principal)
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData?.session) {
            throw new Error('No hay sesión activa');
          }

          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          if (!supabaseUrl) {
            throw new Error('VITE_SUPABASE_URL no está configurada');
          }

          const response = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionData.session.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
              full_name: formData.full_name,
              phone: formData.phone || null,
              role: formData.role,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Error al crear usuario');
          }

          setSuccess(result.message || 'Usuario creado correctamente');
          handleCloseModal();
          await loadUsers();
        } catch (edgeFunctionError: any) {
          // Si falla la Edge Function, intentar método alternativo con signUp
          console.warn('Edge Function no disponible, intentando método alternativo:', edgeFunctionError);
          
          try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
              email: formData.email,
              password: formData.password,
              options: {
                data: {
                  full_name: formData.full_name,
                  role: formData.role
                }
              }
            });

            if (authError) {
              if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
                setError('⚠️ Este email ya está registrado. Puedes actualizar el perfil del usuario existente desde aquí, o crearlo manualmente en Supabase Auth.');
                return;
              }
              throw authError;
            }

            if (authData?.user) {
              // Crear perfil en public.users
              try {
                await userService.createUserProfile({
                  id: authData.user.id,
                  email: formData.email,
                  full_name: formData.full_name,
                  phone: formData.phone || null,
                  role: formData.role
                });
                setSuccess('Usuario creado correctamente. El usuario recibirá un email de confirmación.');
              } catch (profileError: any) {
                if (profileError.message?.includes('duplicate') || profileError.message?.includes('already exists')) {
                  await userService.update(authData.user.id, {
                    full_name: formData.full_name,
                    phone: formData.phone || null,
                    role: formData.role
                  } as any);
                  setSuccess('Perfil de usuario actualizado correctamente');
                } else {
                  throw profileError;
                }
              }
            } else {
              throw new Error('No se pudo crear el usuario en Auth');
            }

            setSuccess('Usuario creado correctamente (método alternativo)');
            handleCloseModal();
            await loadUsers();
          } catch (signUpError: any) {
            console.error('Error creating user:', signUpError);
            setError('Error al crear usuario: ' + (signUpError.message || 'Error desconocido') + '. Como alternativa, puedes crear el usuario manualmente en Supabase Auth (Authentication → Users → Add User) y luego actualizar el perfil aquí.');
          }
        }
      } catch (err: any) {
        console.error('Error creating user:', err);
        setError('Error al crear usuario: ' + (err.message || 'Error desconocido'));
      } finally {
        setCreatingAuth(false);
      }
    } else {
      // Actualizar usuario existente
      try {
        const updates: any = {
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone || null
        };

        // Solo actualizar rol si cambió
        if (formData.role !== editingUser.role) {
          updates.role = formData.role;
        }

        await userService.update(editingUser.id, updates);
        setSuccess('Usuario actualizado correctamente');
        handleCloseModal();
        await loadUsers();
      } catch (err: any) {
        setError('Error al actualizar usuario: ' + err.message);
      }
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Estás seguro de eliminar el usuario "${name}"? Esta acción no se puede deshacer.`)) return;

    try {
      await userService.delete(id);
      setSuccess('Usuario eliminado correctamente');
      await loadUsers();
    } catch (err: any) {
      setError('Error al eliminar: ' + err.message);
    }
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    try {
      await userService.toggleActive(id, !currentStatus);
      setSuccess(`Usuario ${!currentStatus ? 'activado' : 'pausado'} correctamente`);
      await loadUsers();
    } catch (err: any) {
      setError('Error: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="danger" />
        <p className="mt-3">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">Gestión de Usuarios</h3>
          <p className="text-muted mb-0">Administra empleados y repartidores del sistema</p>
        </div>
        <Button variant="danger" onClick={() => handleOpenModal()}>
          <Plus size={18} className="me-2" />
          Nuevo Usuario
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th style={{ width: '150px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center text-muted">
                No hay usuarios registrados
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.full_name}</strong></td>
                <td>
                  <div className="d-flex align-items-center gap-1">
                    <Mail size={14} className="text-muted" />
                    {user.email}
                  </div>
                </td>
                <td>
                  {user.phone ? (
                    <div className="d-flex align-items-center gap-1">
                      <Phone size={14} className="text-muted" />
                      {user.phone}
                    </div>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  <Badge bg={user.role === 'delivery' ? 'info' : 'secondary'}>
                    {user.role === 'delivery' ? 'Repartidor' : 'Empleado'}
                  </Badge>
                </td>
                <td>
                  {(user as any).is_active !== false ? (
                    <Badge bg="success">Activo</Badge>
                  ) : (
                    <Badge bg="secondary">Pausado</Badge>
                  )}
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => handleOpenModal(user)}
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant={(user as any).is_active !== false ? 'outline-warning' : 'outline-success'}
                      onClick={() => handleToggleActive(user.id, (user as any).is_active !== false)}
                      title={(user as any).is_active !== false ? 'Pausar' : 'Activar'}
                    >
                      {(user as any).is_active !== false ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(user.id, user.full_name)}
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
            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ padding: '24px' }}>
            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Nombre Completo *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    placeholder="Ej: Juan Pérez"
                    style={{ fontSize: '15px', padding: '10px' }}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="Ej: usuario@ejemplo.com"
                    style={{ fontSize: '15px', padding: '10px' }}
                    disabled={!!editingUser}
                  />
                  {editingUser && (
                    <Form.Text className="text-muted small">
                      El email no se puede modificar
                    </Form.Text>
                  )}
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Teléfono</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ej: +56912345678"
                    style={{ fontSize: '15px', padding: '10px' }}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Tipo de Usuario *</Form.Label>
                  <Form.Select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'employee' | 'delivery' })}
                    required
                    style={{ fontSize: '15px', padding: '10px' }}
                  >
                    <option value="employee">Empleado</option>
                    <option value="delivery">Repartidor</option>
                  </Form.Select>
                  <Form.Text className="text-muted small">
                    Solo se pueden crear empleados y repartidores
                  </Form.Text>
                </Form.Group>
              </div>
            </div>

            {!editingUser && (
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Contraseña *</Form.Label>
                    <Form.Control
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      placeholder="Mínimo 6 caracteres"
                      style={{ fontSize: '15px', padding: '10px' }}
                      minLength={6}
                    />
                    <Form.Text className="text-muted small">
                      Mínimo 6 caracteres
                    </Form.Text>
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Confirmar Contraseña *</Form.Label>
                    <Form.Control
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      placeholder="Repite la contraseña"
                      style={{ fontSize: '15px', padding: '10px' }}
                      minLength={6}
                    />
                  </Form.Group>
                </div>
              </div>
            )}


            {/* Información adicional */}
            <div className="mt-3 p-3 rounded" style={{ background: '#e7f3ff', border: '1px solid #b3d9ff' }}>
              <div className="d-flex align-items-start gap-2">
                <div style={{ fontSize: '20px' }}>ℹ️</div>
                <div>
                  <strong className="text-primary">Información:</strong>
                  <ul className="mb-0 mt-2 small text-muted">
                    <li>Los <strong>Empleados</strong> pueden gestionar pedidos presenciales</li>
                    <li>Los <strong>Repartidores</strong> pueden ver y gestionar entregas</li>
                    <li>Al pausar un usuario, no podrá iniciar sesión temporalmente</li>
                    <li>La eliminación es permanente y no se puede deshacer</li>
                  </ul>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer style={{ padding: '16px 24px', borderTop: '1px solid #dee2e6' }}>
            <Button variant="secondary" onClick={handleCloseModal} disabled={creatingAuth} style={{ padding: '8px 20px' }}>
              Cancelar
            </Button>
            <Button variant="danger" type="submit" disabled={creatingAuth} style={{ padding: '8px 20px', fontWeight: '600' }}>
              {creatingAuth ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Creando...
                </>
              ) : (
                editingUser ? 'Guardar Cambios' : 'Crear Usuario'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}


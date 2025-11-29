# 📤 Instrucciones para Subir a GitHub

## ✅ Estado Actual

- ✅ Repositorio Git inicializado
- ✅ Remote configurado: `https://github.com/Pirloko/Montenegros_Pizza.git`
- ✅ Commit realizado con todos los archivos (120 archivos, 30,067 líneas)

## 🚀 Pasos para Hacer Push

### Opción 1: Si el repositorio de GitHub está vacío o quieres sobrescribir todo

```bash
git push -u origin main --force
```

⚠️ **Advertencia**: Esto sobrescribirá completamente el contenido del repositorio remoto.

### Opción 2: Si quieres fusionar con contenido existente (Recomendado)

```bash
# 1. Primero, intenta hacer pull y fusionar
git pull origin main --allow-unrelated-histories

# 2. Si hay conflictos, resuélvelos manualmente
# 3. Luego haz push
git push -u origin main
```

### Opción 3: Si solo quieres actualizar tu rama main

```bash
git push -u origin main
```

## 🔐 Autenticación

Si te pide credenciales, tienes dos opciones:

### Opción A: Personal Access Token (Recomendado)
1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Genera un nuevo token con permisos `repo`
3. Cuando Git pida contraseña, usa el token

### Opción B: SSH (Más seguro para el futuro)
```bash
# Cambiar a SSH
git remote set-url origin git@github.com:Pirloko/Montenegros_Pizza.git
```

## 📋 Verificar Estado

Después del push, verifica:

```bash
git log --oneline -5
git remote -v
git status
```

## ✅ Comandos Completos

```bash
# 1. Verificar que todo esté commiteado
git status

# 2. Ver el último commit
git log --oneline -1

# 3. Hacer push
git push -u origin main

# O si necesitas force (CUIDADO: sobrescribe remoto)
git push -u origin main --force
```

---

**Nota**: Si tienes problemas con la autenticación, puedes usar GitHub Desktop o configurar SSH keys.


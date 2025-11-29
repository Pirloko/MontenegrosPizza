# 🚀 DESPLEGAR MONTENEGRO PIZZA EN NETLIFY

## 📋 PASOS PARA EL DEPLOY

### 1️⃣ **Crear Cuenta en Netlify** (si no tienes)

Ve a: https://www.netlify.com/
- Regístrate con tu cuenta de GitHub

---

### 2️⃣ **Nuevo Site desde Git**

1. Click en **"Add new site"** → **"Import an existing project"**
2. Selecciona **"Deploy with GitHub"**
3. Autoriza Netlify para acceder a tu GitHub
4. Busca y selecciona: **`Montenegros_Pizza`**
5. Selecciona la rama: **`main`**

---

### 3️⃣ **Configurar Build Settings**

En la pantalla de configuración:

**Build command:**
```
npm run build
```

**Publish directory:**
```
dist
```

**Base directory:** (dejar vacío)

---

### 4️⃣ **Variables de Entorno** ⚠️ IMPORTANTE

Antes de hacer deploy, haz click en **"Advanced"** → **"New variable"**

Agrega estas 2 variables de entorno:

**Variable 1:**
- **Key:** `VITE_SUPABASE_URL`
- **Value:** `https://tu-proyecto.supabase.co` (reemplaza con tu URL real)

**Variable 2:**
- **Key:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `tu_clave_anon_aqui` (reemplaza con tu clave anon real de Supabase)

📝 **Nota:** Estas son las mismas variables de tu archivo `.env`

---

### 5️⃣ **Deploy**

1. Haz click en **"Deploy"** (o "Deploy site")
2. Espera 2-3 minutos mientras Netlify:
   - Instala dependencias (`npm install`)
   - Ejecuta el build (`npm run build`)
   - Despliega el sitio

---

### 6️⃣ **Verificar el Deploy**

Una vez completado verás:

✅ **Deploy successful!**

Te dará una URL como:
```
https://random-name-12345.netlify.app
```

**Prueba:**
1. Abre la URL
2. Intenta hacer login con tu cuenta de administrador
3. Verifica que todo funcione correctamente

---

## 🔧 **CONFIGURACIONES ADICIONALES**

### Cambiar el Nombre del Sitio

1. Ve a **Site settings** → **Site details**
2. Click en **"Change site name"**
3. Escribe: `montenegro-pizza` (o el nombre que quieras)
4. Ahora tu URL será: `https://montenegro-pizza.netlify.app`

### Dominio Personalizado (Opcional)

Si tienes un dominio:
1. Ve a **Domain management** → **Add custom domain**
2. Sigue las instrucciones para configurar DNS

---

## 🐛 **TROUBLESHOOTING**

### ❌ Error: "Build failed"

**Solución:**
- Verifica que las variables de entorno estén configuradas
- Revisa el log de build en Netlify
- Asegúrate de que `npm run build` funcione localmente

### ❌ Error: "Page not found" al navegar

**Solución:**
- Verifica que `netlify.toml` esté en la raíz del proyecto
- Debe tener el redirect configurado

### ❌ Error: Login no funciona

**Solución:**
1. Ve a Supabase → Settings → API
2. Copia de nuevo las variables
3. Actualiza en Netlify: **Site settings** → **Environment variables**
4. Haz **"Trigger deploy"** para reconstruir

### ❌ Error: Supabase CORS

**Solución:**
1. Ve a Supabase → Authentication → URL Configuration
2. Agrega tu URL de Netlify a **"Site URL"**
3. Agrega tu URL a **"Redirect URLs"**:
   - `https://tu-sitio.netlify.app/*`
   - `https://tu-sitio.netlify.app/login`

---

## 🔄 **DEPLOYS AUTOMÁTICOS**

Una vez configurado, cada vez que hagas `git push` a la rama `main`:
- Netlify detectará automáticamente los cambios
- Ejecutará el build
- Desplegará la nueva versión

¡Sin hacer nada adicional! 🎉

---

## 📊 **MONITOREO**

Netlify te da:
- ✅ Analytics gratis
- ✅ Logs de build
- ✅ Preview de Pull Requests
- ✅ Rollback a versiones anteriores

Todo en: **Deploys** → Click en cualquier deploy → Ver logs

---

## 🎯 **CHECKLIST FINAL**

Antes de compartir el sitio:

- [ ] Login funciona (admin, cliente, empleado, repartidor)
- [ ] Modo oscuro funciona
- [ ] Se pueden crear pedidos
- [ ] Se pueden calificar pedidos
- [ ] Dashboard de admin carga los gráficos
- [ ] Repartidor ve sus estadísticas
- [ ] No hay errores en consola del navegador

---

## 🚀 **¡LISTO!**

Tu aplicación Montenegro Pizza ahora está en producción en Netlify.

**URL de ejemplo:**
```
https://montenegro-pizza.netlify.app
```

**Nota:** Asegúrate de crear usuarios de prueba en Supabase Auth antes de probar el login.

---

**¿Problemas?** Revisa los logs en Netlify o pregúntame. 💪


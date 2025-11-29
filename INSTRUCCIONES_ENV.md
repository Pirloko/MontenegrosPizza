# INSTRUCCIONES PARA CREAR EL ARCHIVO .env
# ==========================================

# 1. Ve a tu proyecto de Supabase
# 2. Ve a Settings > API
# 3. Copia la URL y la clave anónima
# 4. Crea un archivo llamado ".env" en la raíz del proyecto
# 5. Agrega estas líneas:

VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# IMPORTANTE:
# - Reemplaza "tuproyecto" con el nombre real de tu proyecto
# - Reemplaza la clave con tu clave anónima real
# - NO incluyas espacios alrededor del signo =
# - NO agregues comillas alrededor de los valores

# EJEMPLO REAL:
# VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5ODc2ODAwMCwiZXhwIjoyMDE0MzQ0MDAwfQ.ejemplo_de_clave_muy_larga_aqui

# DESPUÉS DE CREAR EL ARCHIVO:
# 1. Reinicia el servidor de desarrollo
# 2. La aplicación debería conectarse a Supabase correctamente

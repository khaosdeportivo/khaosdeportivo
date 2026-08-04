# Khaos Deportivo

Tienda web de réplicas deportivas (catálogo + panel de administración).

## Estructura

```
/
├── index.html          # Catálogo público
├── admin.html          # Panel de administración
├── terminos.html       # Términos y condiciones
├── productos.json      # Inventario (fuente de verdad en GitHub)
├── css/
│   ├── styles.css      # Estilos del catálogo
│   └── admin.css       # Estilos del admin
├── js/
│   ├── shared.js       # Lógica del catálogo público
│   ├── admin.js        # Panel admin (núcleo único)
│   ├── admin-categories.js
│   ├── admin-operations.js
│   ├── admin-promo-gift.js
│   ├── promo-gift.js
│   ├── promo-gift-integrate.js
│   └── logo-fix.js
├── images/
└── logo.jpeg
```

## Cómo funciona el guardado

1. Al crear / editar / borrar un producto se actualiza `localStorage`.
2. Se marca `khaos_pending_sync = 1`.
3. Se llama a `syncToGithub()` (con reintentos si hay conflicto de SHA).
4. Si el envío falla, al refrescar **no se pierden** los cambios locales pendientes.
5. El botón **Guardar cambios** fuerza la publicación a GitHub.

## Requisitos del token GitHub

En **Ajustes** del admin, pega un token personal (`ghp_` o `github_pat_`) con permiso de escritura en el repositorio.

## Desarrollo

- Catálogo: abrir `index.html` (GitHub Pages: `/`).
- Admin: abrir `admin.html`.
- Los cambios de inventario se reflejan en `productos.json` vía API de GitHub.

## Notas

- Las imágenes de producto están alojadas en Google Drive; deben tener permiso de visualización pública.
- No subas tokens al repositorio.

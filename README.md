# Khaos Deportivo

Tienda web de replicas deportivas (catalogo + panel de administracion).

## Estructura

```
/
├── index.html              # Catalogo publico
├── admin.html              # Panel admin (loader + nucleo)
├── terminos.html
├── productos.json          # Inventario (fuente de verdad)
├── README.md
├── css/
│   ├── styles.css
│   └── admin.css
├── js/
│   ├── shared.js           # Catalogo publico
│   ├── khaos-admin-core.js # Persistencia UNICA del admin
│   ├── admin.js            # Stub (nucleo UI desde CDN fijado)
│   ├── admin-categories.js
│   ├── admin-operations.js
│   ├── admin-promo-gift.js
│   ├── promo-gift.js
│   ├── promo-gift-integrate.js
│   └── logo-fix.js
├── images/
└── logo.jpeg
```

## Guardado (admin)

1. Crear / editar / borrar actualiza `localStorage` y marca `khaos_pending_sync=1`.
2. `syncToGithub()` publica `productos.json` (reintentos si hay conflicto SHA).
3. Si falla la red, al refrescar **no se pierden** los cambios pendientes.
4. Boton **Guardar cambios** fuerza la publicacion.

## Token GitHub

En **Ajustes** del admin: token `ghp_` o `github_pat_` con permiso de escritura en este repo.

## Uso

1. Ctrl+F5 en el admin
2. Haz el cambio
3. Espera "Guardado en GitHub (N productos)"
4. Luego puedes refrescar

## Notas

- Imagenes en Google Drive: deben ser publicas para verse en la web.
- No subas tokens al repositorio.

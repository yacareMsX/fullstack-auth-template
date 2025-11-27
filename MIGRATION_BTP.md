# Guía de Migración a SAP BTP con PostgreSQL

Esta guía detalla los pasos para migrar tu aplicación Node.js y base de datos PostgreSQL local a SAP Business Technology Platform (BTP) utilizando el servicio de PostgreSQL (Hyperscaler Option).

**Ventaja**: Al usar PostgreSQL en BTP, **no necesitas cambiar tu código SQL ni tu esquema**, ya que es la misma tecnología que usas localmente.

## 1. Prerrequisitos en SAP BTP

1.  **Cuenta SAP BTP**: Necesitas una cuenta con derechos para crear instancias.
2.  **Cloud Foundry CLI**: Herramienta `cf` instalada.
3.  **Servicio PostgreSQL**: Debes crear una instancia de PostgreSQL en tu espacio.
    *   Comando típico: `cf create-service postgresql-db standard my-postgres-db`
    *   (El nombre del servicio y plan pueden variar según el proveedor, ej. `postgresql-db`, `aws-rds`, etc.)

## 2. Migración de Datos (Local -> BTP)

Como ambos son PostgreSQL, la migración es directa usando herramientas estándar.

### Pasos:
1.  **Crear un Túnel SSH (Opcional pero recomendado)**:
    Para conectar tu máquina local a la BBDD en BTP, a veces necesitas usar `cf ssh` o una aplicación "bridge".
    *   Alternativa: Desplegar `pgAdmin` o usar el "Dashboard" del servicio si lo tiene.

2.  **Exportar datos locales (`pg_dump`)**:
    ```bash
    pg_dump -U tu_usuario_local -h localhost -d tu_bbdd_local -f backup.sql
    ```

3.  **Importar en BTP (`psql`)**:
    Una vez tengas conexión a la BBDD remota (host, usuario, password):
    ```bash
    psql -U usuario_remoto -h host_remoto -d bbdd_remota -f backup.sql
    ```

## 3. Adaptación del Código Node.js (`server/db.js`)

En local usas un archivo `.env`. En BTP, las credenciales se inyectan automáticamente en una variable de entorno llamada `VCAP_SERVICES`.

**Necesitamos modificar `server/db.js`** para que detecte automáticamente si está en BTP o en local.

### Lógica a implementar:
*   Si existe `VCAP_SERVICES`: Leer credenciales de ahí.
*   Si no existe: Leer de `.env` (como funciona ahora).

## 4. Configuración de Despliegue (`manifest.yml`)

Crearemos un archivo `manifest.yml` para decirle a BTP cómo desplegar la app y vincularla a la base de datos.

```yaml
---
applications:
  - name: compliance-hub-server
    path: ./server
    memory: 256M
    buildpack: nodejs_buildpack
    services:
      - my-postgres-db  # El nombre de tu servicio PostgreSQL creado en el paso 1
```

## 5. Sincronización con GitHub

1.  Sube tu código a GitHub (`git push`).
2.  Puedes conectar tu cuenta de BTP a GitHub para despliegues automáticos o usar GitHub Actions.

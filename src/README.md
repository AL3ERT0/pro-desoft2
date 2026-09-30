## Generación de componentes

Angular CLI incluye herramientas para generar diferentes elementos de la aplicación.

Para generar un nuevo componente, utiliza:

```bash
ng generate component nombre-del-componente
```

También puedes utilizar la forma abreviada:

```bash
ng g c nombre-del-componente
```

Para consultar todas las opciones disponibles de generación, ejecuta:

```bash
ng generate --help
```

Entre los elementos que puedes generar se encuentran:

* Componentes
* Directivas
* Pipes
* Servicios
* Guards
* Interceptores
* Entre otros

---

## 🏗️ Compilación del proyecto

Para compilar el proyecto, ejecuta:

```bash
ng build
```

Los archivos generados se almacenarán en la carpeta:

```text
dist/
```

La compilación de producción optimiza la aplicación para mejorar su rendimiento y velocidad.

---

## 🧪 Pruebas unitarias

Para ejecutar las pruebas unitarias utilizando **Vitest**, ejecuta:

```bash
ng test
```

Este comando ejecutará las pruebas configuradas en el proyecto y mostrará los resultados en la terminal.

---

## 🔄 Pruebas end-to-end

Para ejecutar las pruebas de extremo a extremo (E2E), utiliza:

```bash
ng e2e
```

Angular CLI no incluye un framework de pruebas E2E específico por defecto. Dependiendo de las necesidades del proyecto, se puede integrar una herramienta como **Playwright** o **Cypress**.

---

## 📚 Recursos adicionales

Para obtener más información sobre Angular CLI, sus comandos y las diferentes opciones disponibles, puedes consultar la documentación oficial:

[Angular CLI: descripción general y referencia de comandos](https://angular.dev/tools/cli)

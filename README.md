# MicroJ_Handler

## A handler for CRUD functions for the app.

## Getting Started

1. `npm install`
2. Add the following environment variables for typeORM:

```
  TYPEORM_CONNECTION: mysql,
  TYPEORM_HOST: localhost,
  TYPEORM_PORT: 3306,
  TYPEORM_USERNAME: <USER-NAME-FOR-MYSQL>,
  TYPEORM_PASSWORD: <PASSWORD-FOR-MYSQL>,
  TYPEORM_DATABASE: microjdev,
  TYPEORM_ENTITIES: /absolute/path/to/mocker/src/shared/db/models/*.ts,
  TYPEORM_SYNCHRONIZE: true
```

3. `npm run start`

# Baseline Typescript Node App

## Getting Started

1. `npm install`
2. Add the following environment variables for typeORM:

```
  TYPEORM_CONNECTION: mysql,
  TYPEORM_HOST: localhost,
  TYPEORM_PORT: 3306,
  TYPEORM_USERNAME: <USER-NAME-FOR-MYSQL>,
  TYPEORM_PASSWORD: <PASSWORD-FOR-MYSQL>,
  TYPEORM_DATABASE: <DATABASE-YOU-INTEND-TO-USE>,
  TYPEORM_ENTITIES: /absolute/path/to/project/src/shared/db/models/*.ts,
  TYPEORM_SYNCHRONIZE: true
```

3. `npm run start`

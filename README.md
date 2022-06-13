### iSee Core API

🚧 Under Construction 🚧

### Endpoints Available

#### Questionnaire

- Get All: `GET /questionnaire`
- Create: `POST /questionnaire`
- Update: `PATCH /questionnaire/:id`
- Delete: `DELETE /questionnaire/:id`

#### Usecases

- Get All: `GET /usecases`
- Create: `POST /usecases`
- Update: `PATCH /usecases/:id`
- Delete: `DELETE /usecases/:id`

#### Usecases => Personas

- Add New: `POST /usecases/:id/persona`
- Update: `PATCH /usecases/:id/persona/:personaId`
- Delete: `DELETE /usecases/:id/persona/:personaId`

### Setup

```
npm install
```

Create a .env file and change the DB connection string as required

```
npm start
```

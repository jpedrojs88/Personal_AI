# AI Coach API Examples

## Generate workout plan

```bash
curl -X POST http://localhost:3333/ai-coach/generate-plan \
  -H "Content-Type: application/json" \
  -d '{
    "age": 28,
    "sex": "male",
    "weight": 82,
    "height": 178,
    "goal": "hypertrophy",
    "experienceLevel": "intermediate",
    "availableDays": ["Segunda-feira", "Quarta-feira", "Sexta-feira"],
    "trainingLocation": "gym"
  }'
```

## Chat with AI Coach

```bash
curl -X POST http://localhost:3333/ai-coach/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_AQUI",
    "message": "Quero uma versao mais rapida do treino de hoje",
    "goal": "hypertrophy",
    "experienceLevel": "intermediate",
    "availableDays": ["Segunda-feira", "Quarta-feira", "Sexta-feira"],
    "trainingLocation": "gym",
    "currentPlanTitle": "Plano Academia 3x"
  }'
```

## Get saved chat history

```bash
curl http://localhost:3333/ai-coach/chat/USER_ID_AQUI
```

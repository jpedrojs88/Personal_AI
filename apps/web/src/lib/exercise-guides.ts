export type ExerciseGuidePattern =
  | "chest-press"
  | "overhead-press"
  | "triceps-pushdown"
  | "lat-pulldown"
  | "row"
  | "biceps-curl"
  | "leg-press"
  | "leg-curl"
  | "squat"
  | "lunge"
  | "calf-raise"
  | "plank"
  | "dead-bug"
  | "generic";

export interface ExerciseGuide {
  pattern: ExerciseGuidePattern;
  title: string;
  summary: string;
  equipment: string;
  steps: string[];
  attentionPoints: string[];
  disclaimer: string;
  demo?: {
    frames: string[];
    sourceLabel: string;
    sourceUrl: string;
  };
}

const publicDomainFramesBaseUrl =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

function createPublicDomainDemo(path: string) {
  return {
    frames: [
      `${publicDomainFramesBaseUrl}/${path}/0.jpg`,
      `${publicDomainFramesBaseUrl}/${path}/1.jpg`,
    ],
    sourceLabel: "Free Exercise DB (Unlicense)",
    sourceUrl: "https://github.com/yuhonas/free-exercise-db",
  };
}

const guideLibrary: Record<ExerciseGuidePattern, Omit<ExerciseGuide, "title">> = {
  "chest-press": {
    pattern: "chest-press",
    summary: "Empurre a carga para longe do peito com ombros firmes e punhos neutros.",
    equipment: "Maquina, barra ou halteres",
    steps: [
      "Ajuste o banco e mantenha peito aberto, escapulas apoiadas e pes no chao.",
      "Desca a carga controlando o movimento ate a linha media do peito.",
      "Empurre para cima sem travar o cotovelo e sem tirar o ombro do banco.",
    ],
    attentionPoints: [
      "Nao deixe o cotovelo abrir demais para os lados.",
      "Se sentir o ombro pinçando, reduza amplitude e carga.",
    ],
    disclaimer: "Guia educativo. Em caso de dor aguda, interrompa e ajuste com um profissional.",
    demo: createPublicDomainDemo("Barbell_Bench_Press_-_Medium_Grip"),
  },
  "overhead-press": {
    pattern: "overhead-press",
    summary: "Leve a carga acima da cabeca com tronco firme e abdome ativo.",
    equipment: "Maquina ou halteres",
    steps: [
      "Sente ou fique em pe com coluna neutra e gluteos firmes.",
      "Inicie com a carga na altura dos ombros e punhos alinhados.",
      "Empurre para cima em linha quase reta e retorne sem despencar.",
    ],
    attentionPoints: [
      "Evite arquear muito a lombar para compensar o peso.",
      "Mantenha o pescoco relaxado e a cabeca neutra.",
    ],
    disclaimer: "Use controle em toda a subida e descida para proteger ombros e lombar.",
    demo: createPublicDomainDemo("Dumbbell_Shoulder_Press"),
  },
  "triceps-pushdown": {
    pattern: "triceps-pushdown",
    summary: "Estenda os cotovelos para baixo mantendo o braco colado ao corpo.",
    equipment: "Polia alta com corda ou barra",
    steps: [
      "Fique estavel, com peito aberto e cotovelos perto das costelas.",
      "Empurre a corda para baixo ate estender o cotovelo.",
      "Suba devagar sem deixar o ombro puxar o movimento.",
    ],
    attentionPoints: [
      "Nao balance o tronco para ganhar impulso.",
      "O movimento deve sair do cotovelo, nao do ombro.",
    ],
    disclaimer: "Priorize controle e contração do triceps antes de aumentar a carga.",
    demo: createPublicDomainDemo("Triceps_Pushdown_-_Rope_Attachment"),
  },
  "lat-pulldown": {
    pattern: "lat-pulldown",
    summary: "Puxe a barra em direcao ao peito com o cotovelo apontando para baixo.",
    equipment: "Polia alta",
    steps: [
      "Segure a barra e sente com coxas bem apoiadas no trava-pernas.",
      "Puxe levando os cotovelos para baixo e para tras ate a parte alta do peito.",
      "Retorne devagar ate quase estender os bracos por completo.",
    ],
    attentionPoints: [
      "Evite deitar demais o tronco para tras.",
      "Nao puxe atras da nuca; prefira a frente do corpo.",
    ],
    disclaimer: "Pense em aproximar os cotovelos do bolso para ativar melhor as costas.",
    demo: createPublicDomainDemo("Wide-Grip_Lat_Pulldown"),
  },
  row: {
    pattern: "row",
    summary: "Puxe em direcao ao tronco com peito aberto e escapulas trabalhando juntas.",
    equipment: "Polia, maquina ou halter",
    steps: [
      "Comece com coluna neutra e ombros longe das orelhas.",
      "Puxe trazendo o cotovelo para tras sem girar o tronco.",
      "Volte controlando ate sentir alongamento sem perder postura.",
    ],
    attentionPoints: [
      "Nao arredonde a lombar para buscar mais amplitude.",
      "Evite puxar so com o antebraco; pense em iniciar pelo cotovelo.",
    ],
    disclaimer: "Mantenha ritmo constante para transformar a remada em trabalho de costas, nao de impulso.",
    demo: createPublicDomainDemo("Seated_Cable_Rows"),
  },
  "biceps-curl": {
    pattern: "biceps-curl",
    summary: "Flexione o cotovelo levando a carga para cima sem balancar o corpo.",
    equipment: "Barra, halteres ou cabo",
    steps: [
      "Fique alto, com ombros baixos e cotovelos perto do tronco.",
      "Suba a carga ate a linha do peito sem projetar o ombro para frente.",
      "Desca devagar, controlando a volta ate quase estender por completo.",
    ],
    attentionPoints: [
      "Evite jogar o quadril para frente para levantar mais peso.",
      "Mantenha punho firme, sem quebrar para tras.",
    ],
    disclaimer: "Menos impulso e mais controle costumam gerar melhor estimulo no biceps.",
    demo: createPublicDomainDemo("Barbell_Curl"),
  },
  "leg-press": {
    pattern: "leg-press",
    summary: "Empurre a plataforma com o pe inteiro apoiado e joelhos alinhados.",
    equipment: "Leg press",
    steps: [
      "Ajuste o assento e apoie totalmente lombar e quadril no encosto.",
      "Desca a plataforma ate o joelho flexionar sem arredondar a lombar.",
      "Empurre de volta distribuindo forca por todo o pe.",
    ],
    attentionPoints: [
      "Nao deixe o joelho colapsar para dentro.",
      "Nao retire o quadril do banco no final da descida.",
    ],
    disclaimer: "Amplitude boa e segura vale mais do que descer alem do seu controle.",
    demo: createPublicDomainDemo("Leg_Press"),
  },
  "leg-curl": {
    pattern: "leg-curl",
    summary: "Flexione o joelho trazendo o rolo para perto sem tirar o quadril do apoio.",
    equipment: "Mesa flexora",
    steps: [
      "Ajuste o eixo da maquina na linha do joelho.",
      "Leve o calcanhar em direcao ao gluteo com movimento continuo.",
      "Retorne lentamente sentindo o posterior alongar.",
    ],
    attentionPoints: [
      "Nao deixe a lombar compensar no fim do movimento.",
      "Evite chutar o peso para cima sem controle.",
    ],
    disclaimer: "Pause um instante no pico para sentir melhor o posterior de coxa.",
    demo: createPublicDomainDemo("Seated_Leg_Curl"),
  },
  squat: {
    pattern: "squat",
    summary: "Sente para tras e para baixo com pe firme e tronco organizado.",
    equipment: "Peso corporal, halter ou barra",
    steps: [
      "Posicione os pes em largura confortavel e abdome ativo.",
      "Inicie dobrando quadril e joelhos ao mesmo tempo, como se fosse sentar.",
      "Suba empurrando o chao sem perder alinhamento do joelho.",
    ],
    attentionPoints: [
      "Nao deixe o joelho cair para dentro na subida.",
      "Mantenha o peito vivo para nao colapsar o tronco.",
    ],
    disclaimer: "Se sua mobilidade limitar a amplitude, reduza a profundidade e mantenha a tecnica.",
    demo: createPublicDomainDemo("Goblet_Squat"),
  },
  lunge: {
    pattern: "lunge",
    summary: "Desca em linha reta com base estavel e joelho dianteiro alinhado ao pe.",
    equipment: "Peso corporal ou halteres",
    steps: [
      "Dê um passo firme e mantenha o tronco alto.",
      "Desca flexionando os dois joelhos ate perto de noventa graus.",
      "Empurre o chao com o pe da frente para retornar.",
    ],
    attentionPoints: [
      "Evite encurtar demais a passada e apertar o joelho da frente.",
      "Nao jogue o corpo para frente para subir.",
    ],
    disclaimer: "No afundo, estabilidade vale mais do que pressa. Comece leve.",
    demo: createPublicDomainDemo("Dumbbell_Lunges"),
  },
  "calf-raise": {
    pattern: "calf-raise",
    summary: "Suba na ponta dos pes e desca controlando toda a amplitude do tornozelo.",
    equipment: "Maquina, degrau ou peso corporal",
    steps: [
      "Apoie o antepe de forma segura e alinhe joelhos e quadril.",
      "Suba o maximo que conseguir sem jogar o tronco.",
      "Desca devagar ate alongar a panturrilha com controle.",
    ],
    attentionPoints: [
      "Evite quicar no fundo do movimento.",
      "Mantenha o peso distribuido entre dedo do pe e parte externa.",
    ],
    disclaimer: "A panturrilha responde melhor com pausa e amplitude completa.",
    demo: createPublicDomainDemo("Barbell_Seated_Calf_Raise"),
  },
  plank: {
    pattern: "plank",
    summary: "Mantenha o corpo em linha reta com abdomen firme e quadril neutro.",
    equipment: "Peso corporal",
    steps: [
      "Apoie antebracos abaixo dos ombros e afaste os pes confortavelmente.",
      "Ative abdomen e gluteos como se quisesse aproximar as costelas do quadril.",
      "Respire curto e constante sem deixar o quadril despencar.",
    ],
    attentionPoints: [
      "Nao eleve demais o quadril para facilitar.",
      "Se a lombar pesar, reduza o tempo e reative o abdomen.",
    ],
    disclaimer: "Qualidade de postura e mais importante do que segundos extras.",
    demo: createPublicDomainDemo("Plank"),
  },
  "dead-bug": {
    pattern: "dead-bug",
    summary: "Movimente braco e perna opostos mantendo a lombar apoiada no solo.",
    equipment: "Peso corporal",
    steps: [
      "Deite com joelhos e quadris em noventa graus e bracos para cima.",
      "Estenda devagar um braco e a perna oposta sem perder contato da lombar com o chao.",
      "Volte ao centro e repita alternando os lados.",
    ],
    attentionPoints: [
      "Nao deixe as costelas abrirem durante a descida.",
      "Movimento lento costuma ensinar melhor a estabilidade do core.",
    ],
    disclaimer: "Se perder a lombar no chao, reduza a amplitude e continue controlado.",
    demo: createPublicDomainDemo("Dead_Bug"),
  },
  generic: {
    pattern: "generic",
    summary: "Use este guia como referencia inicial antes de ajustar sua execucao ao seu corpo.",
    equipment: "Equipamento varia",
    steps: [
      "Organize postura, respiracao e apoio antes de iniciar a primeira repeticao.",
      "Execute a fase de subir e descer com controle, sem pressa.",
      "Pare se sentir dor aguda e refine a tecnica antes de aumentar a carga.",
    ],
    attentionPoints: [
      "Evite usar impulso para completar repeticoes.",
      "Amplitude segura e melhor do que amplitude maxima sem controle.",
    ],
    disclaimer: "Este exemplo e educativo e nao substitui orientacao presencial individual.",
    demo: createPublicDomainDemo("Incline_Push-Up"),
  },
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function inferPattern(exerciseName: string, muscleGroup?: string): ExerciseGuidePattern {
  const name = normalize(exerciseName);
  const group = normalize(muscleGroup ?? "");

  if (name.includes("supino") || name.includes("crucifixo") || name.includes("peck")) return "chest-press";
  if (name.includes("desenvolvimento")) return "overhead-press";
  if (name.includes("triceps") || name.includes("corda")) return "triceps-pushdown";
  if (name.includes("puxada")) return "lat-pulldown";
  if (name.includes("remada")) return "row";
  if (name.includes("rosca")) return "biceps-curl";
  if (name.includes("leg press")) return "leg-press";
  if (name.includes("mesa flexora")) return "leg-curl";
  if (name.includes("agach")) return "squat";
  if (name.includes("afundo")) return "lunge";
  if (name.includes("panturr")) return "calf-raise";
  if (name.includes("prancha")) return "plank";
  if (name.includes("dead bug")) return "dead-bug";
  if (name.includes("flexao")) return "chest-press";

  if (group.includes("peito")) return "chest-press";
  if (group.includes("ombro")) return "overhead-press";
  if (group.includes("triceps")) return "triceps-pushdown";
  if (group.includes("costas")) return "row";
  if (group.includes("biceps")) return "biceps-curl";
  if (group.includes("posterior")) return "leg-curl";
  if (group.includes("pernas")) return "squat";
  if (group.includes("core")) return "plank";

  return "generic";
}

export function getExerciseGuide(exerciseName: string, muscleGroup?: string): ExerciseGuide {
  const pattern = inferPattern(exerciseName, muscleGroup);
  const baseGuide = guideLibrary[pattern];

  return {
    ...baseGuide,
    title: exerciseName,
  };
}

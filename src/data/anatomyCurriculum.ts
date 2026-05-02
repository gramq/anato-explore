import type { TissueType } from "@/components/skeleton/SkeletonScene";

export interface AnatomyCurriculumInfo {
  system: string;
  segment: string;
  group: string;
  subgroup?: string;
  aspect?: string;
  functionHint: string;
}

const SOURCE_NOTE =
  "Structurare adaptata dupa manualul de Biologie, clasa a XI-a, Corint: capitolul Miscarea - sistem osos, articulatii si sistem muscular.";

function hasAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function inferAspect(name: string): string {
  if (hasAny(name, ["clavicular part of deltoid", "pectoralis", "sternum", "manubrium", "xiphoid"])) {
    return "Fata anterioara";
  }

  if (
    hasAny(name, [
      "scapular spinal part of deltoid",
      "infraspinatus",
      "teres major",
      "teres minor",
      "triceps",
      "anconeus",
      "rhomboid",
      "trapezius",
      "latissimus dorsi",
      "occipital",
      "posterior",
      "dorsal",
      "extensor",
      "gluteus",
      "biceps femoris",
      "semitendinosus",
      "semimembranosus",
      "gastrocnemius",
      "soleus",
    ])
  ) {
    return "Fata posterioara";
  }

  if (
    hasAny(name, [
      "anterior",
      "frontal",
      "biceps brachii",
      "brachialis",
      "coracobrachialis",
      "flexor",
      "pronator",
      "rectus",
      "sartorius",
      "vastus",
      "tibialis anterior",
    ])
  ) {
    return "Fata anterioara";
  }

  if (hasAny(name, ["lateral", "acromial part of deltoid", "fibularis", "zygomatic", "temporal"])) {
    return "Fata laterala";
  }

  if (hasAny(name, ["medial", "adductor", "gracilis", "ulna", "palatine", "vomer"])) {
    return "Fata mediala";
  }

  if (hasAny(name, ["deep", "profund", "subscapularis", "multifidus", "interossei"])) {
    return "Plan profund";
  }

  return "Plan general";
}

function withAspect(info: AnatomyCurriculumInfo, name: string): AnatomyCurriculumInfo {
  return {
    ...info,
    aspect: info.aspect ?? inferAspect(name),
  };
}

function muscleInfo(name: string): AnatomyCurriculumInfo {
  if (
    hasAny(name, [
      "occipitalis",
      "splenius",
      "rectus posterior",
      "obliquus superior capitis",
      "obliquus inferior capitis",
      "semispinalis",
      "longissimus capitis",
    ])
  ) {
    return {
      system: "Sistem muscular",
      segment: "Cap si gat",
      group: "Muschii cefei",
      subgroup: "Plan posterior",
      aspect: "Fata posterioara",
      functionHint: "Participa la extensia, rotatia si stabilizarea capului si gatului.",
    };
  }

  if (
    hasAny(name, [
      "frontalis",
      "occipitalis",
      "temporalis",
      "masseter",
      "orbicularis",
      "zygomaticus",
      "buccinator",
      "mentalis",
      "risorius",
      "nasalis",
      "pterygoid",
    ])
  ) {
    return {
      system: "Sistem muscular",
      segment: "Cap",
      group: "Muschii capului",
      subgroup: hasAny(name, ["masseter", "temporalis", "pterygoid"])
        ? "Muschii masticatori"
        : "Muschii mimicii",
      functionHint: "Participa la mimica fetei sau la masticatie.",
    };
  }

  if (
    hasAny(name, [
      "sternocleidomastoid",
      "scalenus",
      "omohyoid",
      "sternohyoid",
      "sternothyroid",
      "thyrohyoid",
      "longus colli",
      "platysma",
      "digastric",
      "mylohyoid",
    ])
  ) {
    return {
      system: "Sistem muscular",
      segment: "Gat",
      group: "Muschii gatului",
      subgroup: "Regiunea anterolaterala si planurile profunde",
      functionHint: "Ajuta la miscarile capului, gatului si la stabilizarea regiunii cervicale.",
    };
  }

  if (
    hasAny(name, [
      "trapezius",
      "latissimus dorsi",
      "rhomboid",
      "levator scapulae",
      "splenius",
      "iliocostalis",
      "longissimus",
      "spinalis",
      "multifidus",
      "thoracolumbar",
    ])
  ) {
    return {
      system: "Sistem muscular",
      segment: "Trunchi",
      group: "Muschii spatelui si ai cefei",
      subgroup: "Plan superficial si planuri profunde",
      functionHint: "Sustin postura si participa la miscarile trunchiului, capului si centurii scapulare.",
    };
  }

  if (
    hasAny(name, [
      "pectoralis",
      "serratus anterior",
      "intercostal",
      "subclavius",
      "transversus thoracis",
      "diaphragm",
    ])
  ) {
    return {
      system: "Sistem muscular",
      segment: "Trunchi",
      group: "Muschii anterolaterali ai toracelui",
      subgroup: hasAny(name, ["intercostal", "diaphragm"])
        ? "Muschii respiratori"
        : "Muschii peretelui toracic",
      functionHint: "Contribuie la miscarile toracelui, respiratie si stabilizarea umarului.",
    };
  }

  if (
    hasAny(name, [
      "rectus abdominis",
      "oblique",
      "transversus abdominis",
      "pyramidalis",
      "quadratus lumborum",
      "linea alba",
      "inguinal ligament",
    ])
  ) {
    return {
      system: "Sistem muscular",
      segment: "Trunchi",
      group: "Muschii anterolaterali ai abdomenului",
      subgroup: "Peretele abdominal",
      functionHint: "Sustin peretele abdominal si participa la flexia, rotatia si stabilizarea trunchiului.",
    };
  }

  if (
    hasAny(name, [
      "deltoid",
      "supraspinatus",
      "infraspinatus",
      "subscapularis",
      "teres major",
      "teres minor",
    ])
  ) {
    const shoulderSubgroup = hasAny(name, ["clavicular part of deltoid", "subscapularis"])
      ? "Umar anterior"
      : hasAny(name, ["scapular spinal part of deltoid", "infraspinatus", "teres major", "teres minor"])
        ? "Umar posterior"
        : hasAny(name, ["acromial part of deltoid", "supraspinatus"])
          ? "Umar lateral/superior"
          : "Centura scapulara si articulatia umarului";

    return {
      system: "Sistem muscular",
      segment: "Membru superior",
      group: "Muschii umarului",
      subgroup: shoulderSubgroup,
      aspect: shoulderSubgroup.includes("posterior")
        ? "Fata posterioara"
        : shoulderSubgroup.includes("anterior")
          ? "Fata anterioara"
          : shoulderSubgroup.includes("lateral")
            ? "Fata laterala"
            : undefined,
      functionHint: "Mobilizeaza si stabilizeaza umarul.",
    };
  }

  if (
    hasAny(name, [
      "biceps brachii",
      "brachialis",
      "coracobrachialis",
      "triceps brachii",
      "anconeus",
    ])
  ) {
    return {
      system: "Sistem muscular",
      segment: "Membru superior",
      group: "Muschii bratului",
      subgroup: hasAny(name, ["triceps", "anconeus"]) ? "Loja posterioara" : "Loja anterioara",
      functionHint: "Realizeaza miscari ale bratului si antebratului, mai ales flexie sau extensie.",
    };
  }

  if (
    hasAny(name, [
      "pronator",
      "supinator",
      "flexor carpi",
      "extensor carpi",
      "flexor digitorum",
      "extensor digitorum",
      "brachioradialis",
      "palmaris",
    ])
  ) {
    return {
      system: "Sistem muscular",
      segment: "Membru superior",
      group: "Muschii antebratului",
      subgroup: hasAny(name, ["flexor", "pronator"]) ? "Grup anterior" : "Grup posterior/lateral",
      functionHint: "Controleaza miscarile antebratului, mainii si degetelor.",
    };
  }

  if (hasAny(name, ["pollicis", "lumbrical", "interossei", "opponens", "palmar", "digiti minimi of hand"])) {
    return {
      system: "Sistem muscular",
      segment: "Membru superior",
      group: "Muschii mainii",
      subgroup: "Fata palmara si spatiile interosoase",
      functionHint: "Permit miscari fine ale degetelor si prizei mainii.",
    };
  }

  if (hasAny(name, ["gluteus", "piriformis", "gemellus", "obturator", "quadratus femoris", "iliopsoas"])) {
    return {
      system: "Sistem muscular",
      segment: "Membru inferior",
      group: "Muschii bazinului",
      subgroup: "Regiunea soldului",
      functionHint: "Stabilizeaza soldul si participa la miscarile coapsei.",
    };
  }

  if (
    hasAny(name, [
      "sartorius",
      "rectus femoris",
      "vastus",
      "adductor",
      "gracilis",
      "biceps femoris",
      "semitendinosus",
      "semimembranosus",
      "tensor fasciae latae",
      "pectineus",
    ])
  ) {
    return {
      system: "Sistem muscular",
      segment: "Membru inferior",
      group: "Muschii coapsei",
      subgroup: hasAny(name, ["biceps femoris", "semitendinosus", "semimembranosus"])
        ? "Loja posterioara"
        : hasAny(name, ["adductor", "gracilis", "pectineus"])
          ? "Loja mediala"
          : "Loja anterioara",
      functionHint: "Participa la miscarile coapsei, genunchiului si la locomotie.",
    };
  }

  if (
    hasAny(name, [
      "tibialis",
      "fibularis",
      "gastrocnemius",
      "soleus",
      "plantaris",
      "popliteus",
      "extensor hallucis",
      "flexor hallucis",
    ])
  ) {
    return {
      system: "Sistem muscular",
      segment: "Membru inferior",
      group: "Muschii gambei",
      subgroup: hasAny(name, ["tibialis anterior", "extensor"])
        ? "Loja anterolaterala"
        : "Loja posterioara",
      functionHint: "Controleaza miscarile gambei, labei piciorului si degetelor.",
    };
  }

  if (hasAny(name, ["hallucis", "digiti minimi of foot", "plantar", "foot", "quadratus plantae"])) {
    return {
      system: "Sistem muscular",
      segment: "Membru inferior",
      group: "Muschii piciorului",
      subgroup: "Fata dorsala si fata plantara",
      functionHint: "Sustin bolta plantara si miscarile degetelor piciorului.",
    };
  }

  return {
    system: "Sistem muscular",
    segment: "Corp",
    group: "Muschii scheletici",
    subgroup: SOURCE_NOTE,
    functionHint: "Muschii scheletici sunt componenta activa a miscarii.",
  };
}

function boneInfo(name: string): AnatomyCurriculumInfo {
  if (
    hasAny(name, [
      "frontal",
      "parietal",
      "temporal",
      "occipital",
      "sphenoid",
      "ethmoid",
      "maxilla",
      "mandible",
      "zygomatic",
      "nasal",
      "lacrimal",
      "palatine",
      "vomer",
    ])
  ) {
    const cranialSubgroup = hasAny(name, ["occipital"])
      ? "Neurocraniu - regiunea posterioara"
      : hasAny(name, ["frontal"])
        ? "Neurocraniu - regiunea anterioara"
        : hasAny(name, ["parietal"])
          ? "Neurocraniu - regiunea superolaterala"
          : hasAny(name, ["temporal"])
            ? "Neurocraniu - regiunea laterala"
            : hasAny(name, ["maxilla", "mandible", "zygomatic", "nasal", "lacrimal", "palatine", "vomer"])
              ? "Viscerocraniu"
              : "Neurocraniu";

    return {
      system: "Sistem osos",
      segment: "Cap",
      group: "Scheletul capului",
      subgroup: cranialSubgroup,
      aspect: cranialSubgroup.includes("posterioara")
        ? "Fata posterioara"
        : cranialSubgroup.includes("anterioara")
          ? "Fata anterioara"
          : cranialSubgroup.includes("laterala")
            ? "Fata laterala"
            : undefined,
      functionHint: "Protejeaza encefalul si formeaza suportul fetei.",
    };
  }

  if (hasAny(name, ["vertebra", "atlas", "axis", "sacrum", "coccyx"])) {
    return {
      system: "Sistem osos",
      segment: "Trunchi",
      group: "Coloana vertebrala",
      subgroup: hasAny(name, ["cervical", "atlas", "axis"])
        ? "Regiunea cervicala"
        : hasAny(name, ["thoracic", "t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8", "t9", "t10", "t11", "t12"])
          ? "Regiunea toracala"
          : hasAny(name, ["lumbar", "l1", "l2", "l3", "l4", "l5"])
            ? "Regiunea lombara"
            : "Regiunea sacrala/coccigiana",
      functionHint: "Sustine corpul, protejeaza maduva spinarii si permite miscari ale trunchiului.",
    };
  }

  if (hasAny(name, ["rib", "sternum", "manubrium", "xiphoid"])) {
    return {
      system: "Sistem osos",
      segment: "Trunchi",
      group: "Scheletul toracelui",
      subgroup: hasAny(name, ["rib"]) ? "Coaste" : "Stern",
      functionHint: "Protejeaza inima si plamanii si participa la mecanica respiratiei.",
    };
  }

  if (hasAny(name, ["hip bone", "ilium", "ischium", "pubis", "acetabulum"])) {
    return {
      system: "Sistem osos",
      segment: "Membru inferior",
      group: "Centura pelvina",
      subgroup: "Os coxal si bazin osos",
      functionHint: "Leaga membrul inferior de trunchi si preia greutatea corpului.",
    };
  }

  if (hasAny(name, ["clavicle", "scapula"])) {
    return {
      system: "Sistem osos",
      segment: "Membru superior",
      group: "Centura scapulara",
      subgroup: "Clavicula si scapula",
      functionHint: "Leaga membrul superior de torace.",
    };
  }

  if (hasAny(name, ["humerus"])) {
    return {
      system: "Sistem osos",
      segment: "Membru superior",
      group: "Scheletul bratului",
      subgroup: "Humerus",
      functionHint: "Actioneaza ca parghie pentru miscarile membrului superior.",
    };
  }

  if (hasAny(name, ["radius", "ulna"])) {
    return {
      system: "Sistem osos",
      segment: "Membru superior",
      group: "Scheletul antebratului",
      subgroup: "Radius si ulna",
      functionHint: "Sustine miscarile antebratului si mainii.",
    };
  }

  if (hasAny(name, ["carpal", "metacarpal", "phalanx of hand"])) {
    return {
      system: "Sistem osos",
      segment: "Membru superior",
      group: "Scheletul mainii",
      subgroup: "Carpiene, metacarpiene si falange",
      functionHint: "Asigura suportul pentru miscarile fine ale mainii.",
    };
  }

  if (hasAny(name, ["femur", "patella"])) {
    return {
      system: "Sistem osos",
      segment: "Membru inferior",
      group: "Scheletul coapsei",
      subgroup: hasAny(name, ["patella"]) ? "Rotula" : "Femur",
      functionHint: "Preia greutatea corpului si participa la locomotie.",
    };
  }

  if (hasAny(name, ["tibia", "fibula"])) {
    return {
      system: "Sistem osos",
      segment: "Membru inferior",
      group: "Scheletul gambei",
      subgroup: "Tibia si fibula",
      functionHint: "Sustine greutatea si miscarile gambei.",
    };
  }

  if (hasAny(name, ["tarsal", "metatarsal", "phalanx of foot", "calcaneus", "talus", "cuboid", "cuneiform", "navicular"])) {
    return {
      system: "Sistem osos",
      segment: "Membru inferior",
      group: "Scheletul piciorului",
      subgroup: "Tarsiene, metatarsiene si falange",
      functionHint: "Sustine statica, mersul si echilibrul.",
    };
  }

  return {
    system: "Sistem osos",
    segment: "Corp",
    group: "Schelet",
    subgroup: SOURCE_NOTE,
    functionHint: "Oasele formeaza componenta pasiva a aparatului locomotor.",
  };
}

export function classifyAnatomyStructure(input: {
  tissue: TissueType;
  label?: string;
  labelEn?: string;
  id?: string;
}): AnatomyCurriculumInfo {
  const name = normalize([input.labelEn, input.label, input.id].filter(Boolean).join(" "));

  if (input.tissue === "os") return withAspect(boneInfo(name), name);

  if (input.tissue === "tendon") {
    const muscle = muscleInfo(name);
    return withAspect({
      ...muscle,
      system: "Tendoane si tesut conjunctiv",
      group: muscle.group.replace("Muschii", "Tendoanele/fasciile asociate muschilor"),
      functionHint: "Leaga, stabilizeaza sau transmit forta dintre muschi, oase si articulatii.",
    }, name);
  }

  return withAspect(muscleInfo(name), name);
}

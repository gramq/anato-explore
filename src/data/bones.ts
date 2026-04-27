// Date anatomice: oasele corpului uman (selecție extinsă din 206)
// Categoriile acoperă scheletul axial și apendicular complet.

export type BoneCategory =
  | "craniu"
  | "fata"
  | "ureche"
  | "gat"
  | "coloana"
  | "torace"
  | "centura-scapulara"
  | "brat"
  | "antebrat"
  | "mana"
  | "centura-pelviana"
  | "coapsa"
  | "gamba"
  | "picior";

export interface Bone {
  id: string;
  name: string;
  latin: string;
  category: BoneCategory;
  count: number; // câte există în corp
  description: string;
  funcție: string;
}

export const categoryLabels: Record<BoneCategory, string> = {
  craniu: "Craniu (neurocraniu)",
  fata: "Oasele feței",
  ureche: "Urechea medie",
  gat: "Gât și hioid",
  coloana: "Coloana vertebrală",
  torace: "Cutia toracică",
  "centura-scapulara": "Centura scapulară",
  brat: "Brațul",
  antebrat: "Antebrațul",
  mana: "Mâna",
  "centura-pelviana": "Centura pelviană",
  coapsa: "Coapsa",
  gamba: "Gamba",
  picior: "Piciorul",
};

export const bones: Bone[] = [
  // Neurocraniu (8)
  { id: "frontal", name: "Os frontal", latin: "Os frontale", category: "craniu", count: 1, description: "Os plat ce formează fruntea și partea anterioară a bolții craniene.", funcție: "Protejează lobii frontali ai creierului și formează plafonul orbitelor." },
  { id: "parietal", name: "Oase parietale", latin: "Os parietale", category: "craniu", count: 2, description: "Două oase pereche ce alcătuiesc părțile laterale și superioare ale calotei craniene.", funcție: "Protejează emisferele cerebrale." },
  { id: "temporal", name: "Oase temporale", latin: "Os temporale", category: "craniu", count: 2, description: "Conțin urechea internă și medie; situate lateral, sub parietale.", funcție: "Adăpostesc structurile auditive și de echilibru." },
  { id: "occipital", name: "Os occipital", latin: "Os occipitale", category: "craniu", count: 1, description: "Os posterior al craniului, cu marele orificiu (foramen magnum).", funcție: "Permite trecerea măduvei spinării și protejează cerebelul." },
  { id: "sfenoid", name: "Os sfenoid", latin: "Os sphenoidale", category: "craniu", count: 1, description: "Os central în formă de fluture, articulat cu toate celelalte oase craniene.", funcție: "Susține baza craniului și conține șaua turcească pentru hipofiză." },
  { id: "etmoid", name: "Os etmoid", latin: "Os ethmoidale", category: "craniu", count: 1, description: "Os ușor și spongios, situat între orbite, formând tavanul cavității nazale.", funcție: "Suport pentru mucoasa olfactivă; conține celulele etmoidale." },

  // Oasele feței (14)
  { id: "maxilar", name: "Maxilare", latin: "Maxilla", category: "fata", count: 2, description: "Formează mandibula superioară și conțin alveolele dentare superioare.", funcție: "Susțin dentiția superioară și formează plafonul cavității bucale." },
  { id: "mandibula", name: "Mandibulă", latin: "Mandibula", category: "fata", count: 1, description: "Singurul os mobil al craniului; formează maxilarul inferior.", funcție: "Permite masticația și articularea vorbirii." },
  { id: "zigomatic", name: "Oase zigomatice", latin: "Os zygomaticum", category: "fata", count: 2, description: "Oasele pomeților obrajilor.", funcție: "Conturează fața și protejează lateral orbitele." },
  { id: "nazal", name: "Oase nazale", latin: "Os nasale", category: "fata", count: 2, description: "Două oase mici ce formează puntea nasului.", funcție: "Susțin partea superioară a piramidei nazale." },
  { id: "lacrimal", name: "Oase lacrimale", latin: "Os lacrimale", category: "fata", count: 2, description: "Cele mai mici oase ale feței, situate în peretele medial al orbitei.", funcție: "Conțin canalul nazo-lacrimal." },
  { id: "palatin", name: "Oase palatine", latin: "Os palatinum", category: "fata", count: 2, description: "Formează partea posterioară a palatului dur.", funcție: "Separă cavitatea bucală de cea nazală." },
  { id: "vomer", name: "Vomer", latin: "Vomer", category: "fata", count: 1, description: "Os subțire ce formează partea inferioară a septului nazal.", funcție: "Divide cavitatea nazală în două fose." },
  { id: "cornet-inf", name: "Cornete nazale inferioare", latin: "Concha nasalis inferior", category: "fata", count: 2, description: "Lame osoase încârligate în peretele lateral al cavității nazale.", funcție: "Încălzesc și umidifică aerul inspirat." },

  // Urechea medie (6)
  { id: "ciocan", name: "Ciocane (Maleole)", latin: "Malleus", category: "ureche", count: 2, description: "Cel mai mare osișor al urechii medii, atașat de timpan.", funcție: "Transmite vibrațiile timpanului către nicovală." },
  { id: "nicovala", name: "Nicovale", latin: "Incus", category: "ureche", count: 2, description: "Os în formă de nicovală, situat între ciocan și scăriță.", funcție: "Continuă transmiterea vibrațiilor sonore." },
  { id: "scarita", name: "Scărițe", latin: "Stapes", category: "ureche", count: 2, description: "Cel mai mic os din corp; sprijinit pe fereastra ovală.", funcție: "Transmite vibrațiile către urechea internă." },

  // Gât (1)
  { id: "hioid", name: "Os hioid", latin: "Os hyoideum", category: "gat", count: 1, description: "Os în formă de potcoavă, suspendat în gât, fără articulații cu alte oase.", funcție: "Punct de inserție pentru mușchii limbii și ai laringelui." },

  // Coloana vertebrală (26)
  { id: "vert-cervicale", name: "Vertebre cervicale (C1–C7)", latin: "Vertebrae cervicales", category: "coloana", count: 7, description: "Cele 7 vertebre ale gâtului, cu Atlas (C1) și Axis (C2) ca primele două.", funcție: "Susțin capul și permit rotația și flexia gâtului." },
  { id: "vert-toracice", name: "Vertebre toracice (T1–T12)", latin: "Vertebrae thoracicae", category: "coloana", count: 12, description: "Vertebrele zonei toracice, articulate cu coastele.", funcție: "Punct de inserție pentru coaste; protejează măduva." },
  { id: "vert-lombare", name: "Vertebre lombare (L1–L5)", latin: "Vertebrae lumbales", category: "coloana", count: 5, description: "Cele mai mari vertebre, situate în zona inferioară a spatelui.", funcție: "Susțin greutatea trunchiului superior." },
  { id: "sacrum", name: "Sacrum", latin: "Os sacrum", category: "coloana", count: 1, description: "Os triunghiular format prin fuziunea a 5 vertebre sacrale.", funcție: "Conectează coloana cu pelvisul." },
  { id: "coccis", name: "Coccis", latin: "Os coccygis", category: "coloana", count: 1, description: "Vârful coloanei, format din 3–5 vertebre fuzionate.", funcție: "Punct de atașare pentru mușchii planșeului pelvian." },

  // Torace (25)
  { id: "stern", name: "Stern", latin: "Sternum", category: "torace", count: 1, description: "Os plat central al toracelui, format din manubriu, corp și apendicele xifoid.", funcție: "Protejează inima și plămânii; punct de inserție pentru coaste." },
  { id: "coaste", name: "Coaste", latin: "Costae", category: "torace", count: 24, description: "12 perechi: 7 adevărate, 3 false, 2 flotante.", funcție: "Formează cutia toracică și protejează organele vitale." },

  // Centura scapulară (4)
  { id: "clavicula", name: "Clavicule", latin: "Clavicula", category: "centura-scapulara", count: 2, description: "Os lung în formă de S, situat orizontal deasupra primei coaste.", funcție: "Conectează membrul superior de torace." },
  { id: "scapula", name: "Scapule (omoplați)", latin: "Scapula", category: "centura-scapulara", count: 2, description: "Oase plate triunghiulare situate posterior pe torace.", funcție: "Articulație pentru humerus; mobilitate amplă a brațului." },

  // Brațul (2)
  { id: "humerus", name: "Humerus", latin: "Humerus", category: "brat", count: 2, description: "Cel mai mare os al membrului superior, între umăr și cot.", funcție: "Suport pentru mușchii brațului; permite mișcările umărului." },

  // Antebrațul (4)
  { id: "radius", name: "Radius", latin: "Radius", category: "antebrat", count: 2, description: "Osul lateral al antebrațului, pe partea policelui.", funcție: "Permite rotația antebrațului (pronație/supinație)." },
  { id: "ulna", name: "Ulnă (cubitus)", latin: "Ulna", category: "antebrat", count: 2, description: "Osul medial al antebrațului, formează vârful cotului.", funcție: "Stabilizează articulația cotului." },

  // Mâna (54)
  { id: "carp", name: "Oase carpiene", latin: "Ossa carpi", category: "mana", count: 16, description: "8 oase pe fiecare mână, dispuse pe două rânduri (scafoid, semilunar, piramidal etc.).", funcție: "Formează încheietura mâinii; permit mobilitate fină." },
  { id: "metacarp", name: "Metacarpiene", latin: "Ossa metacarpi", category: "mana", count: 10, description: "5 oase lungi în palma fiecărei mâini.", funcție: "Susțin palma și articulează degetele." },
  { id: "falange-mana", name: "Falange (mână)", latin: "Phalanges manus", category: "mana", count: 28, description: "14 falange pe mână: 2 pentru police, 3 pentru fiecare deget.", funcție: "Permit mișcarea fină a degetelor." },

  // Centura pelviană (2)
  { id: "coxal", name: "Oase coxale", latin: "Os coxae", category: "centura-pelviana", count: 2, description: "Fiecare format din ilion, ischion și pubis fuzionate.", funcție: "Formează pelvisul; suportă greutatea trunchiului." },

  // Coapsa (4)
  { id: "femur", name: "Femur", latin: "Femur", category: "coapsa", count: 2, description: "Cel mai lung și puternic os din corp.", funcție: "Suportă greutatea corpului în mers și sprijin." },
  { id: "rotula", name: "Rotule (patelă)", latin: "Patella", category: "coapsa", count: 2, description: "Os sesamoid în fața articulației genunchiului.", funcție: "Protejează genunchiul și optimizează acțiunea cvadricepsului." },

  // Gamba (4)
  { id: "tibia", name: "Tibia", latin: "Tibia", category: "gamba", count: 2, description: "Osul medial și mai gros al gambei.", funcție: "Suportă greutatea corpului între genunchi și gleznă." },
  { id: "fibula", name: "Fibulă (peroneu)", latin: "Fibula", category: "gamba", count: 2, description: "Osul subțire lateral al gambei.", funcție: "Stabilizează glezna; punct de inserție musculară." },

  // Piciorul (52)
  { id: "tars", name: "Oase tarsiene", latin: "Ossa tarsi", category: "picior", count: 14, description: "7 oase pe picior, inclusiv calcaneu (călcâi) și astragal.", funcție: "Formează glezna și partea posterioară a piciorului." },
  { id: "metatars", name: "Metatarsiene", latin: "Ossa metatarsi", category: "picior", count: 10, description: "5 oase lungi în partea mijlocie a fiecărui picior.", funcție: "Susțin bolta plantară și transferă greutatea." },
  { id: "falange-picior", name: "Falange (picior)", latin: "Phalanges pedis", category: "picior", count: 28, description: "14 falange pe picior: 2 pentru haluce, 3 pentru fiecare deget.", funcție: "Permit propulsia în mers și echilibrul." },
];

export const totalBoneCount = bones.reduce((sum, b) => sum + b.count, 0);

// Program 12 minggu — Full Body A/B/C (Selasa / Kamis / Sabtu)
// sets: jumlah set per fase [F1, F2, F3]. Minggu 1: gerakan beban dibatasi 2 set.
// unit: 'kg' (beban × reps), 'detik' (isometrik/carry), 'menit' (cardio)

const DAY_OF_WEEK = { 2: 'A', 4: 'B', 6: 'C' }; // JS getDay(): 2=Selasa, 4=Kamis, 6=Sabtu
const DAY_NAME = { A: 'Selasa', B: 'Kamis', C: 'Sabtu' };

const CARDIO = { name: 'Cardio zona 2', t: ['15 mnt', '20 mnt', '20–25 mnt'], sets: [1, 1, 1], unit: 'menit', tip: 'Sepeda statis / elips / jalan incline landai. Masih bisa bicara kalimat utuh.' };

const PROGRAM = {
  A: [
    { name: 'Goblet box squat', t: ['2–3×10–12', '3×8–12', '4×6–10'], sets: [3, 3, 4], unit: 'kg', tip: 'Kotak setinggi lutut (F2: sedikit lebih rendah). Duduk sampai menyentuh kotak, lutut searah jari kaki. Ganti leg press bila nyeri >4.' },
    { name: 'Dumbbell bench press', t: ['2–3×10–12', '3×8–12', '4×6–10'], sets: [3, 3, 4], unit: 'kg', tip: 'Beban dicatat per dumbbell.' },
    { name: 'Lat pulldown', t: ['2–3×10–12', '3×8–12', '4×8–10'], sets: [3, 3, 4], unit: 'kg', tip: 'Tarik ke dada atas, bahu turun.' },
    { name: 'Hip thrust / glute bridge', t: ['2–3×12', '3×10–12', '4×8–10'], sets: [3, 3, 4], unit: 'kg', tip: 'Otot bokong kuat = beban lutut berkurang.' },
    { name: 'Leg extension (ringan)', t: ['2×12–15', '3×12–15', '3×10–15'], sets: [2, 3, 3], unit: 'kg', tip: 'Rentang nyaman, tempo 3 detik saat turun. Penguat paha depan untuk lutut.' },
    { name: 'Seated cable row', t: ['2–3×10–12', '3×10–12', '3×8–12'], sets: [3, 3, 3], unit: 'kg', tip: '' },
    { name: 'Wall sit', t: ['3×30 dtk', '3×45 dtk', '3×60 dtk'], sets: [3, 3, 3], unit: 'detik', tip: 'Sudut lutut ±60–70°, bukan 90°. Isometrik ini biasanya ramah untuk lutut.' },
    { name: 'Dead bug', t: ['2×8/sisi', '3×10/sisi', '3×12/sisi'], sets: [2, 3, 3], unit: 'reps', tip: 'Punggung bawah tetap menempel lantai.' },
  ],
  B: [
    { name: 'Dumbbell Romanian deadlift', t: ['2–3×10–12', '3×8–12', '4×6–10'], sets: [3, 3, 4], unit: 'kg', tip: 'Lutut sedikit ditekuk, dorong pinggul ke belakang, punggung netral.' },
    { name: 'Leg press (rentang nyaman)', t: ['2–3×12', '3×10–12', '4×8–12'], sets: [3, 3, 4], unit: 'kg', tip: 'Kaki agak tinggi di platform = lebih ramah lutut.' },
    { name: 'Incline dumbbell press', t: ['2–3×10–12', '3×8–12', '3×8–10'], sets: [3, 3, 3], unit: 'kg', tip: '' },
    { name: 'Chest-supported DB row', t: ['2–3×10–12', '3×10–12', '3×8–12'], sets: [3, 3, 3], unit: 'kg', tip: '' },
    { name: 'Leg curl', t: ['2×12–15', '3×10–15', '3×10–12'], sets: [2, 3, 3], unit: 'kg', tip: 'Duduk atau berbaring.' },
    { name: 'Step-up kotak rendah', t: ['2×8/kaki (15–20 cm)', '3×8/kaki (20–25 cm)', '3×10/kaki (30 cm)'], sets: [2, 3, 3], unit: 'kg', tip: 'Boleh berpegangan. Naik pelan, turun terkontrol. Beban 0 = tanpa dumbbell.' },
    { name: 'Cable hip abduction / band walk', t: ['2×15/sisi', '3×15/sisi', '3×15/sisi'], sets: [2, 3, 3], unit: 'kg', tip: 'Menstabilkan lutut dari pinggul.' },
    { name: 'Pallof press', t: ['2×10/sisi', '3×10/sisi', '3×12/sisi'], sets: [2, 3, 3], unit: 'kg', tip: '' },
  ],
  C: [
    { name: 'Trap bar deadlift (atau DB RDL)', t: ['2–3×8–10', '3×6–10', '4×5–8'], sets: [3, 3, 4], unit: 'kg', tip: 'Gerakan utama. Minggu 1 mulai ringan sekali.' },
    { name: 'Leg press kaki tinggi / goblet box squat', t: ['2–3×12', '3×10–12', '3×8–12'], sets: [3, 3, 3], unit: 'kg', tip: 'Pilih yang paling nyaman untuk lutut.' },
    { name: 'Seated DB shoulder press', t: ['2–3×10–12', '3×8–12', '3×8–10'], sets: [3, 3, 3], unit: 'kg', tip: '' },
    { name: 'Assisted pull-up / underhand pulldown', t: ['2–3×8–10', '3×8–10', '4×6–10'], sets: [3, 3, 4], unit: 'kg', tip: 'Untuk assisted pull-up, catat beban bantuan (makin kecil = makin kuat).' },
    { name: 'Face pull', t: ['2×15', '3×15', '3×12–15'], sets: [2, 3, 3], unit: 'kg', tip: 'Postur & bahu — bagus untuk yang banyak duduk.' },
    { name: 'Standing calf raise', t: ['2×15', '3×12–15', '3×12–15'], sets: [2, 3, 3], unit: 'kg', tip: '' },
    { name: 'Farmer carry', t: ['3×30 dtk', '3×40 dtk', '4×40 dtk'], sets: [3, 3, 4], unit: 'kg-detik', tip: 'Catat beban per tangan (kg) dan durasi (detik).' },
    { name: 'Side plank', t: ['2×20 dtk/sisi', '3×25 dtk/sisi', '3×30 dtk/sisi'], sets: [2, 3, 3], unit: 'detik', tip: 'Boleh bertumpu lutut dulu.' },
  ],
};

const WARMUP = [
  'Pemanasan 8–10 mnt: sepeda statis ringan + mobilitas pinggul & pergelangan kaki',
  'Band terminal knee extension 2×15/kaki',
  'Straight-leg raise 2×12/kaki',
  'Clamshell 2×15/sisi',
];
const COOLDOWN = 'Pendinginan 5 mnt: stretching paha depan, hamstring, betis, pinggul';

const GUIDE = [
  { title: 'Struktur sesi (75–90 menit)', items: [
    'Pemanasan 8–10 mnt + knee prep 8–10 mnt (checklist di halaman Latihan).',
    'Latihan beban 45–55 mnt. Istirahat 60–90 detik; gerakan besar sampai 2 menit.',
    'Cardio zona 2: 15 mnt (Fase 1) → 20 mnt (Fase 2) → 20–25 mnt (Fase 3).',
    'Pendinginan 5 mnt.',
  ]},
  { title: 'Fase & progresi', items: [
    'Fase 1 (Minggu 1–4) “Kembali”: minggu 1 cukup 2 set, beban ±50–60% dari sebelum berhenti. RPE 6–7.',
    'Fase 2 (Minggu 5–8) “Bangun”: 3 set, RPE 7–8. Kotak squat diturunkan sedikit bila lutut nyaman.',
    'Fase 3 (Minggu 9–12) “Kuat”: gerakan utama 4 set dengan reps lebih rendah, RPE 8.',
    'Double progression: bila SEMUA set mencapai batas atas reps dengan teknik rapi → naikkan beban terkecil (1–2,5 kg) di sesi berikutnya.',
    'RPE = seberapa berat (1–10). RPE 7 = masih sanggup ±3 reps lagi.',
  ]},
  { title: 'Aturan lutut', items: [
    'Nyeri 0–3 selama latihan dan tidak memburuk besok pagi → aman, lanjut.',
    'Nyeri 4–5 → kurangi rentang gerak atau beban. Nyeri >5 → ganti gerakan hari itu.',
    'Kaku setelah duduk lama: berdiri & jalan 3–5 mnt tiap 45–60 mnt duduk; 10× leg extension tanpa beban di kursi.',
    'Periksa ke dokter/fisioterapis bila lutut bengkak, terkunci, terasa goyah/“lepas”, atau nyeri tajam yang menetap.',
  ]},
  { title: 'Langkah & evaluasi', items: [
    'Target langkah naik bertahap tiap 2 minggu (atur di Setelan).',
    'Lihat rata-rata 7 hari, bukan angka harian — BB harian naik-turun karena air, garam, dan siklus.',
    'Bila rata-rata BB tidak turun 2–3 minggu berturut-turut: kurangi 100–150 kcal ATAU tambah 1.000 langkah (salah satu saja).',
    'Perbarui berat di Setelan tiap 4 minggu agar target kalori ikut menyesuaikan.',
  ]},
];

const MENU = [
  ['Sarapan', 'Nasi putih', '100 g (±¾ centong)', 130, 3],
  ['Sarapan', 'Telur rebus', '2 butir', 140, 12],
  ['Sarapan', 'Tempe kukus/bacem tipis', '50 g', 100, 9],
  ['Sarapan', 'Tumis sayur (sedikit minyak)', '1 mangkuk', 80, 3],
  ['Makan siang', 'Nasi putih', '150 g', 195, 4],
  ['Makan siang', 'Dada ayam bakar tanpa kulit', '120 g', 200, 35],
  ['Makan siang', 'Tahu kukus', '100 g', 80, 8],
  ['Makan siang', 'Lalapan / sayur asem', '1 mangkuk', 50, 2],
  ['Camilan', 'Edamame rebus', '100 g', 120, 11],
  ['Camilan', 'Buah (pepaya/apel)', '1 porsi', 80, 1],
  ['Makan malam', 'Ikan kembung/tongkol bakar', '120 g', 200, 28],
  ['Makan malam', 'Nasi putih', '100 g', 130, 3],
  ['Makan malam', 'Tumis kangkung', '1 mangkuk', 70, 3],
  ['Malam (opsional)', 'Susu rendah lemak / whey', '1 gelas / 1 scoop', 120, 20],
  ['Tambahan', 'Minyak, sambal, kecap sepanjang hari', '±1–2 sdm', 150, 0],
];

const NUTRI_RULES = [
  'Metode piring: ½ sayur, ¼ protein (ayam/ikan/telur/tahu/tempe), ¼ karbohidrat (nasi/kentang/ubi).',
  'Protein di setiap makan besar (±30–40 g) — membantu kenyang dan menjaga otot.',
  'Batasi minuman manis (teh manis, kopi susu gula aren, jus bergula) — kalori yang “tidak terasa”.',
  'Pilih bakar/kukus/tumis. Gorengan: hitung kira-kira 100–150 kcal per potong (perkiraan).',
  'Hari gym boleh taruh porsi nasi lebih besar di makan sebelum/sesudah latihan; total harian tetap sama.',
  'Air putih ±2–3 L/hari (lebih di hari gym), kecuali dokter menyarankan lain.',
];

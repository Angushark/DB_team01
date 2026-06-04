// ═══════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════
const CATEGORIES = [
  { id: "all", label: "全部商品", icon: "📦" },
  { id: "mirrorless", label: "微單眼", icon: "📷" },
  { id: "compact", label: "類單眼", icon: "📸" },
  { id: "action", label: "運動相機", icon: "🎬" },
  { id: "cinema", label: "電影機", icon: "🎥" },
  { id: "lens", label: "鏡頭", icon: "🔭" },
  { id: "tripod", label: "腳架", icon: "📐" },
  { id: "memory", label: "記憶卡", icon: "💾" },
  { id: "adapter", label: "轉接環", icon: "⭕" },
  { id: "bag", label: "相機包", icon: "🎒" },
  { id: "battery", label: "電池", icon: "🔋" },
  { id: "light", label: "燈光", icon: "💡" },
  { id: "stabilizer", label: "穩定器", icon: "🎯" },
];

const PRODUCTS = [
  { id: "EQ-001", item_type: "equipment", cat: "mirrorless", name: "Sony α7 IV 微單眼相機", brand: "Sony", model: "ILCE-7M4", type: "微單眼", description: "2021年出廠，快門數約12,000", rent_state: "空置中", rental: 1200, img: "📷", hot: true, isNew: true },
  { id: "EQ-002", item_type: "equipment", cat: "mirrorless", name: "Canon EOS R5", brand: "Canon", model: "EOS-R5", type: "微單眼", description: "2022年出廠，狀況極佳", rent_state: "空置中", rental: 1500, img: "📷", hot: true, isNew: false },
  { id: "EQ-003", item_type: "equipment", cat: "action", name: "GoPro HERO 12 Black", brand: "GoPro", model: "HERO12", type: "運動相機", description: "2023年出廠，含防水殼", rent_state: "空置中", rental: 400, img: "🎬", hot: true, isNew: true },
  { id: "EQ-004", item_type: "equipment", cat: "action", name: "DJI Pocket 3", brand: "DJI", model: "Pocket3", type: "運動相機", description: "2024年出廠，全新庫存品", rent_state: "出租中", rental: 500, img: "🎬", hot: false, isNew: true },
  { id: "EQ-005", item_type: "equipment", cat: "mirrorless", name: "Fujifilm X-T5", brand: "Fujifilm", model: "X-T5", type: "微單眼", description: "2023年出廠，復古造型", rent_state: "空置中", rental: 1000, img: "📷", hot: true, isNew: false },
  { id: "EQ-006", item_type: "equipment", cat: "cinema", name: "Sony FX3 全片幅電影機", brand: "Sony", model: "ILME-FX3", type: "電影機", description: "2022年出廠，專業錄影首選", rent_state: "出租中", rental: 2000, img: "🎥", hot: true, isNew: false },
  { id: "EQ-007", item_type: "equipment", cat: "compact", name: "Sony RX100 VII", brand: "Sony", model: "RX100M7", type: "類單眼", description: "2022年出廠，口袋機皇", rent_state: "空置中", rental: 600, img: "📸", hot: false, isNew: false },
  { id: "LN-001", item_type: "equipment", cat: "lens", name: "Canon RF 70-200mm f/2.8L", brand: "Canon", model: "RF70-200", type: "鏡頭", description: "鏡片潔淨無刮傷", rent_state: "空置中", rental: 800, img: "🔭", hot: true, isNew: false },
  { id: "LN-002", item_type: "equipment", cat: "lens", name: "Sony FE 24-70mm f/2.8 GM II", brand: "Sony", model: "SEL2470GM2", type: "鏡頭", description: "二代輕量化設計", rent_state: "空置中", rental: 700, img: "🔭", hot: false, isNew: true },
  { id: "LN-003", item_type: "equipment", cat: "lens", name: "Sigma 35mm f/1.4 DG DN Art", brand: "Sigma", model: "35F14DG", type: "鏡頭", description: "人像神鏡，銳利散景", rent_state: "空置中", rental: 450, img: "🔭", hot: false, isNew: false },
  { id: "AC-001", item_type: "accessory", cat: "tripod", name: "Manfrotto 碳纖維三腳架", brand: "Manfrotto", model: "MT055C", type: "腳架", description: "碳纖維材質，最大承重9kg", rent_state: "空置中", rental: 300, img: "📐", hot: true, isNew: false },
  { id: "AC-002", item_type: "accessory", cat: "battery", name: "Sony NP-FZ100 原廠電池", brand: "Sony", model: "NP-FZ100", type: "電池", description: "原廠電池，蓄電力約95%", rent_state: "空置中", rental: 150, img: "🔋", hot: false, isNew: false },
  { id: "AC-003", item_type: "accessory", cat: "light", name: "Godox AD200Pro 閃光燈", brand: "Godox", model: "AD200Pro", type: "燈光", description: "200W外拍燈，含無線觸發器", rent_state: "空置中", rental: 350, img: "💡", hot: false, isNew: true },
  { id: "AC-004", item_type: "accessory", cat: "stabilizer", name: "DJI RS 3 Pro 三軸穩定器", brand: "DJI", model: "RS3-Pro", type: "穩定器", description: "專業穩定器，承重4.5kg", rent_state: "出租中", rental: 450, img: "🎯", hot: true, isNew: false },
  { id: "AC-005", item_type: "accessory", cat: "memory", name: "Sony CFexpress Type A 160GB", brand: "Sony", model: "CEA-G160T", type: "記憶卡", description: "高速記憶卡，讀取800MB/s", rent_state: "空置中", rental: 200, img: "💾", hot: false, isNew: true },
  { id: "AC-006", item_type: "accessory", cat: "bag", name: "Peak Design Everyday 30L", brand: "Peak Design", model: "BEDB-30", type: "相機包", description: "多功能雙肩相機包", rent_state: "空置中", rental: 250, img: "🎒", hot: false, isNew: false },
  { id: "AC-007", item_type: "accessory", cat: "adapter", name: "Sigma MC-11 轉接環", brand: "Sigma", model: "MC-11", type: "轉接環", description: "Canon EF → Sony E 自動對焦", rent_state: "空置中", rental: 180, img: "⭕", hot: false, isNew: false },
];

const BANNERS = [
  { id: 1, title: "夏季攝影祭", subtitle: "全站器材租金 85 折起", cta: "立即瀏覽", accent: "#f59e0b", bg: "linear-gradient(135deg, #1a1206 0%, #2d1f0e 50%, #0a0a0a 100%)" },
  { id: 2, title: "運動相機特輯", subtitle: "GoPro / DJI 系列，日租 $400 起", cta: "查看詳情", accent: "#34d399", bg: "linear-gradient(135deg, #071a12 0%, #0d2818 50%, #0a0a0a 100%)" },
  { id: 3, title: "新手入門方案", subtitle: "機身 + 鏡頭 + 腳架，一站搞定", cta: "探索方案", accent: "#7dd3fc", bg: "linear-gradient(135deg, #07131a 0%, #0c2135 50%, #0a0a0a 100%)" },
];

const PROMOS = [
  { title: "新手入門套組", sub: "機身 + 鏡頭 + 配件一次租齊", icon: "🎓", accent: "#34d399", bg: "linear-gradient(135deg, #071a12, #0f1f18)" },
  { title: "專業錄影方案", sub: "電影機 + 穩定器 + 燈光整套出租", icon: "🎬", accent: "#f59e0b", bg: "linear-gradient(135deg, #1a1206, #1f1a0f)" },
  { title: "週末快閃優惠", sub: "週五至週日租借享 9 折", icon: "⚡", accent: "#7dd3fc", bg: "linear-gradient(135deg, #07131a, #0f1a22)" },
];
